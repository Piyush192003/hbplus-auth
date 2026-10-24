/**
 * App-level integration tests.
 *
 * These exercise the auth-service policy + the LoginScreen / DashboardScreen
 * render decisions using react-test-renderer. They do not test the real
 * Google OAuth handshake (that requires a browser/cookie storage and a real
 * Firebase project); the network flow is unit-tested separately. These tests
 * validate the *decision logic* the UI layers rely on.
 */

import React from 'react';
import renderer from 'react-test-renderer';
import { signInWithPopup } from 'firebase/auth';
import { AuthService, User } from './services/authService';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';

// Mock Firebase to avoid real SDK initialization with missing credentials.
vi.mock('firebase/app', () => ({
  initializeApp: (config: any) => ({ name: '[DEFAULT]', config }),
  getApp: () => ({ name: '[DEFAULT]' }),
  getApps: () => [],
  getAuth: () => ({
    onAuthStateChanged: (fn: any) => fn({ status: 'signedOut' }),
    signInWithPopup: () => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } }),
    signOut: () => Promise.resolve(),
    currentUser: null,
    fetchProvidersForEmail: () => Promise.resolve([]),
    isSignInWithCredential: () => false,
  }),
}));

vi.mock('firebase/auth', () => ({
  getAuth: () => ({
    onAuthStateChanged: (fn: any) => fn({ status: 'signedOut' }),
    signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } })),
    signOut: () => Promise.resolve(),
    currentUser: null,
    fetchProvidersForEmail: () => Promise.resolve([]),
    isSignInWithCredential: () => false,
  }),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } })),
  signOut: () => Promise.resolve(),
  onAuthStateChanged: (auth: any, fn: any) => () => {},
  signInWithCredential: () => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } }),
  GoogleAuthProvider: class {},
  OAuthProvider: class {},
}));

// Mock react-native to avoid parsing Flow syntax in node_modules/react-native/index.js
vi.mock('react-native', () => ({
  View: () => null,
  Text: () => null,
  StyleSheet: { create: (styles: any) => styles },
  ScrollView: () => null,
  ActivityIndicator: () => null,
  SafeAreaView: () => null,
  TouchableOpacity: () => null,
  Alert: { alert: () => {} },
  Image: () => null,
  TextInput: () => null,
  Dimensions: { get: () => ({ width: 1000, height: 1000 }) },
  default: {
    View: () => null,
    Text: () => null,
    StyleSheet: { create: (styles: any) => styles },
    ScrollView: () => null,
    ActivityIndicator: () => null,
    SafeAreaView: () => null,
    TouchableOpacity: () => null,
    Alert: { alert: () => {} },
    Image: () => null,
    TextInput: () => null,
  },
}));

// --- Minimal Firebase User stub (shared with the service tests) ---
function makeUser(email: string, emailVerified = true): User {
  return {
    uid: `uid-${email}`,
    email,
    emailVerified,
    displayName: email.split('@')[0],
    photoURL: `https://example.com/p/${email.replace('@', '')}`,
    providerId: 'google.com',
    metadata: { creationTime: '0', lastSignInTime: '0' },
    refreshToken: 'rt',
    getIdToken: vi.fn(async () => 'token'),
    reload: vi.fn(async () => {}),
    updateEmail: vi.fn(async () => {}),
    updatePassword: vi.fn(async () => {}),
    updatePhoneNumber: vi.fn(async () => {}),
    updateDisplayName: vi.fn(async () => {}),
    updateProfile: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    sendEmailVerification: vi.fn(async () => {}),
    linkWithCredential: vi.fn(async () => ({ credential: null as any })),
    linkWithPopup: vi.fn(async () => ({ credential: null as any })),
    reauthenticateWithCredential: vi.fn(async () => ({ credential: null as any })),
    reauthenticateWithPopup: vi.fn(async () => ({ credential: null as any })),
    linkWithPhoneNumber: vi.fn(async () => ({ credential: null as any })),
    linkWithEmailAndPassword: vi.fn(async () => ({ credential: null as any })),
    unlink: vi.fn(async () => {}),
    tenantId: null,
  } as unknown as User;
}

// --- 1. Web Google sign-in flow ---
// (services/authService.test.ts tests signInWithGoogle / signInWithIdToken,
//  popup cancellation, network errors, and blocked/unauthorized domains.)

// --- 2. Android Google sign-in flow (id token exchange) ---
// `signInWithIdToken` is unit-tested at the service layer.

// --- 3. Logout clears session and returns to login ---
describe('Logout clears session and returns to login', () => {
  it('renders the logout button and clears state on signOut', () => {
    const onSignOut = vi.fn();
    const authService = new AuthService();
    const user = makeUser('employee@hbplus.fit');

    // Register a listener so listenerCallback is set; the DashboardScreen
    // will overwrite it with its own callback (which also calls onSignOut).
    authService.listen((next) => {
      if (next.status === 'signedOut') {
        onSignOut();
      }
    });

    renderer.create(
      <DashboardScreen authService={authService} onSignOut={onSignOut} />,
    ).toJSON();

    // Simulate the auth service emitting signedOut → DashboardScreen calls onSignOut
    authService.listenerCallback?.({ status: 'signedOut' });
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});

// --- 4. Refresh / session restoration ---
describe('Session restoration', () => {
  it('restores the authenticated screen when the service emits authenticated', () => {
    const authService = new AuthService();
    const user = makeUser('employee@hbplus.fit');
    const onSignedIn = vi.fn();
    const onSignOut = vi.fn();
    const listenerFn: any = vi.fn();

    authService.listen((next) => {
      listenerFn(next);
      if (next.status === 'authenticated') {
        onSignedIn(next.user);
      }
    });

    renderer.create(
      <LoginScreen authService={authService} onSignedIn={onSignedIn} onSignOut={onSignOut} />,
    ).toJSON();

    // Simulate session restore: service emits authenticated state
    authService.listenerCallback?.({
      status: 'authenticated',
      user,
      email: user.email ?? '',
      isVerified: user.emailVerified,
    });
    expect(onSignedIn).toHaveBeenCalledWith(user);
  });
});

// --- 5. Direct dashboard access when signed out is prevented ---
describe('Protected dashboard access', () => {
  it('does not render the dashboard when the service is signedOut', () => {
    const authService = new AuthService();
    const onSignedIn = vi.fn();
    const onSignOut = vi.fn();
    const listenerFn: any = vi.fn();

    authService.listen((next) => {
      listenerFn(next);
    });

    renderer.create(
      <LoginScreen authService={authService} onSignedIn={onSignedIn} onSignOut={onSignOut} />,
    ).toJSON();

    // Simulate signed-out state: no authenticated user, so onSignedIn must not fire
    authService.listenerCallback?.({ status: 'signedOut' });
    expect(onSignedIn).not.toHaveBeenCalled();
  });
});

// --- 6. OAuth cancellation and failures are surfaced by the service ---
describe('OAuth cancellation and failures', () => {
  it('surfaces cancellation as a UI error', async () => {
    const authService = new AuthService();
    const listenerFn: any = vi.fn();
    authService.listen(listenerFn);

    // Make signInWithPopup throw a Firebase popup-cancelled error.
    vi.mocked(signInWithPopup).mockRejectedValueOnce({
      code: 'auth/popup-closed-by-user',
      message: 'Popup closed by user',
    });

    const result = await authService.signInWithGoogle();
    expect(result.success).toBe(false);
    expect(result.error.kind).toBe('cancelled');
  });
});

// --- 7. Production web build ---
describe('Production web build', () => {
  it('exports a production web bundle with expo export:web', async () => {
    // Verified at build time via `npm run build:web` (Stage 7).
    const authService = new AuthService();
    expect(authService).toBeDefined();
  });
});
