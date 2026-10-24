/**
 * DashboardScreen unit tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import renderer, { act } from 'react-test-renderer';
import { AuthService, User } from '../services/authService';
import { DashboardScreen } from './DashboardScreen';

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

describe('DashboardScreen', () => {
  let authService: AuthService;
  let onSignOut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    authService = new AuthService();
    onSignOut = vi.fn();
  });

  afterEach(() => {
    authService.unlisten();
    vi.restoreAllMocks();
  });

  it('does not crash when rendering', () => {
    authService.listenerCallback = vi.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <DashboardScreen authService={authService} onSignOut={onSignOut} />,
      );
    });

    expect(component).toBeDefined();
  });

  it('renders nothing when signed out', () => {
    authService.listenerCallback = vi.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <DashboardScreen authService={authService} onSignOut={onSignOut} />,
      );
    });

    act(() => {
      authService.listenerCallback!({ status: 'signedOut' });
    });

    expect(component.toJSON()).toBeNull();
  });

  it('triggers signOut when logout is initiated while authenticated', () => {
    const user = makeUser('employee@hbplus.fit');
    authService.listenerCallback = vi.fn();
    vi.spyOn(authService, 'signOut').mockResolvedValue(undefined);

    authService.listen((next) => {
      if (next.status === 'signedOut') {
        onSignOut();
      }
    });

    let component: any;
    act(() => {
      component = renderer.create(
        <DashboardScreen authService={authService} onSignOut={onSignOut} />,
      );
    });

    act(() => {
      authService.listenerCallback!({
        status: 'authenticated',
        user,
        email: user.email ?? '',
        isVerified: user.emailVerified,
      });
    });

    const tree = component.root;
    const logoutButton = tree.findByProps({ testID: 'logout-button' });
    expect(logoutButton).toBeDefined();

    act(() => {
      const onPress = logoutButton.props.onPress;
      if (onPress) {
        onPress();
      }
    });

    expect(authService.signOut).toHaveBeenCalled();
  });
});
