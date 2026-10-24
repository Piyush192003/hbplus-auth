/**
 * AppNavigator integration tests.
 *
 * Exercises the full navigation flow including the development-only mock
 * login button: signed-out -> mock login -> dashboard -> logout -> login.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import renderer, { act } from 'react-test-renderer';
import { AuthService, User } from '../services/authService';
import { AppNavigator } from '../navigation/AppNavigator';

vi.mock('firebase/app', () => ({
  initializeApp: (c: any) => ({ name: '[DEFAULT]', config: c }),
  getApp: () => ({ name: '[DEFAULT]' }),
  getApps: () => [],
}));

vi.mock('firebase/auth', () => ({
  getAuth: () => ({
    onAuthStateChanged: (fn: any) => {
      // Simulate a signed-out session on registration.
      fn(null);
      return () => {};
    },
    signInWithPopup: vi.fn(() => Promise.resolve({ user: null })),
    signOut: vi.fn(() => Promise.resolve()),
    currentUser: null,
    fetchProvidersForEmail: vi.fn(() => Promise.resolve([])),
    isSignInWithCredential: vi.fn(() => false),
  }),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: null })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: (auth: any, fn: any) => {
    fn(null);
    return () => {};
  },
  signInWithCredential: vi.fn(() => Promise.resolve({ user: null })),
  GoogleAuthProvider: class {},
  OAuthProvider: class {},
}));

vi.mock('react-native', () => {
  const React = require('react');
  return {
    View: (p: any) => React.createElement('view', p, p.children),
    Text: (p: any) => React.createElement('text', p, p.children),
    StyleSheet: { create: (s: any) => s },
    ScrollView: (p: any) => React.createElement('scrollview', p, p.children),
    ActivityIndicator: (p: any) => React.createElement('activityindicator', p),
    SafeAreaView: (p: any) => React.createElement('safeareaview', null, p.children),
    TouchableOpacity: (p: any) => React.createElement('touchableopacity', p, p.children),
    Pressable: (p: any) => React.createElement('pressable', p, p.children),
    Image: (p: any) => React.createElement('image', p),
    Dimensions: { get: () => ({ width: 1000, height: 1000 }) },
  };
});

function makeUser(email: string, emailVerified = true): User {
  return {
    uid: `uid-${email}`,
    email,
    emailVerified,
    displayName: email.split('@')[0],
    photoURL: `https://example.com/p/${email.replace('@', '')}`,
    providerId: 'google.com',
  };
}

function findByTestID(root: any, testID: string): any {
  // Recursively search the rendered tree for a node with the given testID.
  const search = (node: any): any => {
    if (!node) return null;
    if (node.props && node.props.testID === testID) return node;
    const children = node.children || [];
    for (const c of children) {
      const found = search(c);
      if (found) return found;
    }
    return null;
  };
  return search(root);
}

describe('AppNavigator', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  afterEach(() => {
    authService.unlisten();
    vi.restoreAllMocks();
  });

  it('transitions to dashboard on mock login and returns to login on logout', async () => {
    authService.listenerCallback = vi.fn();

    let component: any;
    act(() => {
      component = renderer.create(<AppNavigator authService={authService} />);
    });

    // Simulate signed-out session.
    act(() => {
      authService.listenerCallback?.({ status: 'signedOut' });
    });

    // After signed-out state, the dev mock login button is present.
    let root = component.root;
    let mockButton = findByTestID(root, 'dev-mock-login-button');
    expect(mockButton).not.toBeNull();

    // Click the mock login button.
    act(() => {
      const onPress = mockButton.props.onPress;
      if (onPress) onPress();
    });

    // Dashboard should now be rendered with a logout button.
    root = component.root;
    const logoutButton = findByTestID(root, 'logout-button');
    expect(logoutButton).not.toBeNull();

    // Click logout.
    await act(async () => {
      const onPress = logoutButton.props.onPress;
      if (onPress) {
        await onPress();
      }
    });

    // Login screen should be back, with the mock login button.
    root = component.root;
    act(() => {
      authService.listenerCallback?.({ status: 'signedOut' });
    });
    root = component.root;
    const mockButtonAgain = findByTestID(root, 'dev-mock-login-button');
    expect(mockButtonAgain).not.toBeNull();
  });

  it('shows login form on initial signed-out state without manual emit (regression)', () => {
    let component: any;
    act(() => {
      component = renderer.create(<AppNavigator authService={authService} />);
    });
    // Allow effects to settle (Firebase mock fires synchronously during mount).
    act(() => {});

    const root = component.root;
    const mockButton = findByTestID(root, 'dev-mock-login-button');
    expect(mockButton).not.toBeNull();
  });
});