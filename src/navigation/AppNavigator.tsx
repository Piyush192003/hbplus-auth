import { FC, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { AuthService, AuthState } from '../services/authService';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

/**
 * App-level navigation router.
 *
 * The app has two routes and a simple state machine:
 *  - `loading`   → show a full-screen loading indicator while the app
 *                 restores the Firebase session.
 *  - `login`     → the public login screen. Users with an unauthorized
 *                 domain/verification status land here and see the
 *                 access-restricted message (the login screen renders it).
 *  - `dashboard` → the protected dashboard, only rendered when the auth
 *                 service reports `authenticated`.
 *
 * The navigation is deliberately flat and imperative. There is no router
 * dependency, no nested navigators, and no web routing logic to keep the
 * build fast and the maintenance surface small.
 */
export interface AppNavigatorProps {
  /** The auth service instance (singleton in production, injectable in tests). */
  authService: AuthService;
}

export const AppNavigator: FC<AppNavigatorProps> = ({
  authService,
}) => {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [signedOut, setSignedOut] = useState(false);
  const isMockSessionRef = useRef(false);

  // React to the auth service stream. This is the single source of truth
  // for which screen the app renders.
  useEffect(() => {
    console.log('[AppNavigator] useEffect: subscribe', { authService: !!authService });
    const unsubscribe = authService.listen((next) => {
      console.log('[AppNavigator] auth listener: next', next);
      if (next.status === 'signedOut' && isMockSessionRef.current) {
        console.log('[AppNavigator] auth listener: ignore signedOut (mock session)');
        return;
      }
      if (next.status === 'authenticated') {
        isMockSessionRef.current = false;
      }
      setState(next);
      if (next.status === 'signedOut') {
        setSignedOut(true);
      } else if (next.status === 'authenticated') {
        setSignedOut(false);
      }
    });
    return () => {
      console.log('[AppNavigator] useEffect: unsubscribe');
      unsubscribe();
    };
  }, [authService]);

  const navigateToLogin = useCallback(() => {
    isMockSessionRef.current = false;
    setSignedOut(true);
    setState({ status: 'signedOut' });
  }, []);

  // Render the appropriate screen for the current auth state.
  console.log('[AppNavigator] render', { status: state.status, signedOut });
  const renderAuthRoute = () => {
    if (state.status === 'loading') {
      console.log('[AppNavigator] render branch: loading (spinner)');
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Restoring your session…</Text>
        </View>
      );
    }
    if (signedOut || state.status === 'signedOut') {
      console.log('[AppNavigator] render branch: login (signedOut)');
      return (
        <LoginScreen
          authService={authService}
          onSignedIn={(user) => {
            isMockSessionRef.current =
              user.providerId === 'mock' || user.email === 'dev.mock@hbplus.fit';
            setState({
              status: 'authenticated',
              user,
              email: user.email ?? '',
              isVerified: user.emailVerified,
            });
            setSignedOut(false);
          }}
          onSignOut={navigateToLogin}
        />
      );
    }
    if (state.status === 'unauthorized') {
      console.log('[AppNavigator] render branch: login (unauthorized)');
      // The user has a valid Firebase session but failed the domain/
      // verification policy. Show the login screen with the
      // access-restriction message (rendered by the LoginScreen).
      return (
        <LoginScreen
          authService={authService}
          onSignedIn={(user) => {
            isMockSessionRef.current =
              user.providerId === 'mock' || user.email === 'dev.mock@hbplus.fit';
            setState({
              status: 'authenticated',
              user,
              email: user.email ?? '',
              isVerified: user.emailVerified,
            });
            setSignedOut(false);
          }}
          onSignOut={navigateToLogin}
        />
      );
    }
    // authenticated
    return (
      <DashboardScreen
        authService={authService}
        onSignOut={navigateToLogin}
        mockUser={
          state.status === 'authenticated' &&
          (state.user.providerId === 'mock' || state.user.email === 'dev.mock@hbplus.fit')
            ? state.user
            : undefined
        }
      />
    );
  };

  return <SafeAreaView style={styles.safe}>{renderAuthRoute()}</SafeAreaView>;
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
  },
});


