import { FC, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { AuthService, AuthState, AuthError } from '../services/authService';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { DevMockLogin } from '../components/DevMockLogin';

export interface LoginScreenProps {
  authService: AuthService;
  onSignedIn: (user: import('../services/authService').User) => void;
  onSignOut: () => void;
}

export const LoginScreen: FC<LoginScreenProps> = ({
  authService,
  onSignedIn,
  onSignOut,
}) => {
  const [state, setState] = useState<AuthState>({ status: 'loading' as const });
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const [signInInFlight, setSignInInFlight] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.listen((next) => {
      setState(next);
      if (next.status === 'authenticated') {
        onSignedIn(next.user);
      }
      if (next.status === 'signedOut') {
        setLastError(null);
      }
      if (next.status === 'unauthorized') {
        setLastError({ kind: 'unauthorized', domain: next.email });
      }
    });
    return () => {
      unsubscribe();
    };
  }, [authService, onSignedIn, onSignOut]);

  const handleResult = useCallback(
    (result: import('../services/authService').SignInResult) => {
      setSignInInFlight(false);
      setLastError(null);
      if (result.success) {
        return;
      }
      setLastError(result.error);
    },
    [],
  );

  const renderError = () => {
    if (!lastError) return null;
    if (lastError.kind === 'cancelled') {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Sign-in cancelled</Text>
          <Text style={styles.errorMessage}>Please try again.</Text>
        </View>
      );
    }
    if (lastError.kind === 'blocked' || lastError.kind === 'unauthorized') {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Access restricted.</Text>
          <Text style={styles.errorMessage}>
            Please login using your official domain email.
          </Text>
        </View>
      );
    }
    if (lastError.kind === 'network') {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Network error</Text>
          <Text style={styles.errorMessage}>{lastError.message}</Text>
        </View>
      );
    }
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{lastError.message}</Text>
      </View>
    );
  };

  const renderLoading = () => (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  const renderContent = () => {
    if (state.status === 'loading') return renderLoading();
    if (state.status === 'signedOut' || state.status === 'unauthorized') {
      return (
        <>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>HB+</Text>
            </View>
            <View>
              <Text style={styles.brand}>HBPlus</Text>
              <Text style={styles.brandSub}>Secure Workspace Authentication</Text>
            </View>
          </View>

          <Text style={styles.hello}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue to your workspace.
          </Text>

          <View style={styles.alert}>
            <Text style={styles.alertIcon}>i</Text>
            <Text style={styles.alertText}>
              Only @hbplus.fit accounts are authorized.
            </Text>
          </View>

          <View style={styles.card}>
            <GoogleLoginButton
              authService={authService}
              onResult={handleResult}
              loading={signInInFlight}
            />
            <DevMockLogin
              authService={authService}
              onMockSignIn={(user) => onSignedIn(user)}
            />
          </View>

          <Text style={styles.footerText}>
            Authorized access only • HBPlus
          </Text>
        </>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bgDecorTop} />
      <View style={styles.bgDecorBottom} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {renderContent()}
          {renderError()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  bgDecorTop: { position: 'absolute', top: -120, right: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(99, 102, 241, 0.18)' },
  bgDecorBottom: { position: 'absolute', bottom: -140, left: -100, width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(139, 92, 246, 0.14)' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  container: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28, justifyContent: 'center' },
  brandMark: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  brandMarkText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  brand: { fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: 0.3 },
  brandSub: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '600' },
  hello: { fontSize: 30, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#475569', lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 20 },
  alertIcon: { fontSize: 16, color: '#4F46E5', fontWeight: '700' },
  alertText: { fontSize: 13, color: '#3730A3', fontWeight: '600', flex: 1 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 4, marginBottom: 24 },
  footerText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', fontWeight: '500' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  errorContainer: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: '#991B1B', marginBottom: 4 },
  errorMessage: { fontSize: 13, color: '#7F1D1D', textAlign: 'center', lineHeight: 18 },
});
