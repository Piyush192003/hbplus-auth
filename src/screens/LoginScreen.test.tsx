/**
 * LoginScreen unit tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import renderer, { act } from 'react-test-renderer';
import { AuthService, User } from '../services/authService';
import { LoginScreen } from './LoginScreen';
import { DevMockLogin } from '../components/DevMockLogin';

vi.mock('firebase/app', () => ({
  initializeApp: (c: any) => ({ name: '[DEFAULT]', config: c }),
  getApp: () => ({ name: '[DEFAULT]' }),
  getApps: () => [],
}));

vi.mock('firebase/auth', () => ({
  getAuth: () => ({
    onAuthStateChanged: vi.fn(() => () => {}),
    signInWithPopup: vi.fn(() => Promise.resolve({ user: null })),
    signOut: vi.fn(() => Promise.resolve()),
    currentUser: null,
    fetchProvidersForEmail: vi.fn(() => Promise.resolve([])),
    isSignInWithCredential: vi.fn(() => false),
  }),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: null })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn(() => () => {}),
  signInWithCredential: vi.fn(() => Promise.resolve({ user: null })),
  GoogleAuthProvider: class {},
  OAuthProvider: class {},
}));

vi.mock('react-native', () => {
  const React = require('react');
  return {
    View: (p: any) => React.createElement('view', p),
    Text: (p: any) => React.createElement('text', p),
    StyleSheet: { create: (s: any) => s },
    ScrollView: (p: any) => React.createElement('scrollview', p),
    ActivityIndicator: () => React.createElement('activityindicator'),
    SafeAreaView: (p: any) => React.createElement('safeareaview', null, p.children),
    TouchableOpacity: (p: any) => React.createElement('touchableopacity', p),
    Pressable: (p: any) => React.createElement('pressable', p),
    Image: () => React.createElement('image'),
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

describe('LoginScreen', () => {
  let authService: AuthService;
  let onSignedIn: ReturnType<typeof vi.fn>;
  let onSignOut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    authService = new AuthService();
    onSignedIn = vi.fn();
    onSignOut = vi.fn();
  });

  afterEach(() => {
    authService.unlisten();
    vi.restoreAllMocks();
  });

  it('does not crash when rendering signed out', () => {
    authService.listenerCallback = vi.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <LoginScreen authService={authService} onSignedIn={onSignedIn} onSignOut={onSignOut} />,
      );
    });

    act(() => {
      authService.listenerCallback!({ status: 'signedOut' });
    });

    expect(component).toBeDefined();
  });

  it('does not trigger onSignedIn for unauthorized domain', () => {
    authService.listenerCallback = vi.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <LoginScreen authService={authService} onSignedIn={onSignedIn} onSignOut={onSignOut} />,
      );
    });

    act(() => {
      authService.listenerCallback!({
        status: 'unauthorized',
        email: 'user@gmail.com',
        isVerified: false,
      });
    });

    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('does not crash when rendering loading state', () => {
    authService.listenerCallback = vi.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <LoginScreen authService={authService} onSignedIn={onSignedIn} onSignOut={onSignOut} />,
      );
    });

    expect(component).toBeDefined();
  });

  it('dev mode: DevMockLogin renders and button press triggers onSignedIn', () => {
    Object.defineProperty(globalThis, '__DEV__', {
      writable: true,
      configurable: true,
      value: true,
    });

    const onMockSignIn = vi.fn();
    let component: any;
    act(() => {
      component = renderer.create(
        <DevMockLogin authService={authService} onMockSignIn={onMockSignIn} />,
      );
    });

    const tree = component.root;
    const button = tree.findByProps({ testID: 'dev-mock-login-button' });
    expect(button).toBeDefined();

    act(() => {
      const onPress = button.props.onPress;
      if (onPress) {
        onPress();
      }
    });

    expect(onMockSignIn).toHaveBeenCalled();

    // Restore __DEV__
    Object.defineProperty(globalThis, '__DEV__', {
      writable: true,
      configurable: true,
      value: process.env.NODE_ENV !== 'production',
    });
  });

  it('prod mode: DevMockLogin returns null', () => {
    Object.defineProperty(globalThis, '__DEV__', {
      writable: true,
      configurable: true,
      value: false,
    });

    let component: any;
    act(() => {
      component = renderer.create(
        <DevMockLogin authService={authService} onMockSignIn={vi.fn()} />,
      );
    });

    expect(component.toJSON()).toBeNull();

    // Restore __DEV__
    Object.defineProperty(globalThis, '__DEV__', {
      writable: true,
      configurable: true,
      value: process.env.NODE_ENV !== 'production',
    });
  });
});
