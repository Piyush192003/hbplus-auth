import { FC, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { AuthService, AuthState, User } from '../services/authService';

export interface DashboardScreenProps {
  authService: AuthService;
  onSignOut: () => void;
  mockUser?: User;
}

export const DashboardScreen: FC<DashboardScreenProps> = ({ authService, onSignOut, mockUser }) => {
  const [state, setState] = useState<AuthState>(
    mockUser ? { status: 'authenticated', user: mockUser, email: mockUser.email ?? '', isVerified: mockUser.emailVerified } : { status: 'loading' },
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  useEffect(() => {
    if (mockUser) {
      return;
    }
    const unsubscribe = authService.listen((next) => {
      setState(next);
      if (next.status === 'signedOut') {
        onSignOut();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [authService, onSignOut, mockUser]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      if (!mockUser) {
        await authService.signOut();
      }
    } finally {
      onSignOut();
      setIsLoggingOut(false);
    }
  }, [authService, onSignOut, mockUser]);

  const user = state.status === 'authenticated' ? state.user : null;
  const isMock = !!mockUser || user?.providerId === 'mock' || user?.email === 'dev.mock@hbplus.fit';

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  if (state.status !== 'authenticated' || !user) {
    return null;
  }

  const profileImageUrl = user.photoURL ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bgDecorTop} />
      <View style={styles.bgDecorBottom} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>HB+</Text>
            </View>
            <View>
              <Text style={styles.brand}>HBPlus</Text>
              <Text style={styles.brandSub}>Dashboard</Text>
            </View>
          </View>
        </View>

        {isMock && (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBadge}>DEV MOCK</Text>
            <Text style={styles.mockText}>
              This is a development mock session. No real Google authentication occurred.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <View style={styles.profile}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {(user.displayName ?? user.email ?? 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.name}>{user.displayName ?? 'Account'}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={[styles.badge, user.emailVerified ? styles.badgeVerified : styles.badgeUnverified]}>
              <View style={[styles.dot, user.emailVerified ? styles.dotVerified : styles.dotUnverified]} />
              <Text style={[styles.badgeText, user.emailVerified ? styles.badgeTextVerified : styles.badgeTextUnverified]}>
                {user.emailVerified ? 'Email verified' : 'Email not verified'}
              </Text>
            </View>
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.welcome}>Welcome back, {user.displayName ?? 'there'}.</Text>
            <Text style={styles.statusText}>You're signed in and ready to go.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          testID="logout-button"
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.logoutText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  bgDecorTop: { position: 'absolute', top: -120, right: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(99, 102, 241, 0.18)' },
  bgDecorBottom: { position: 'absolute', bottom: -140, left: -100, width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(139, 92, 246, 0.14)' },
  scroll: { flexGrow: 1, padding: 24, maxWidth: 720, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  brandMarkText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  brand: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  brandSub: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '600' },
  mockBanner: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 12, marginBottom: 16, gap: 6 },
  mockBadge: { fontSize: 10, fontWeight: '800', color: '#92400E', letterSpacing: 0.8 },
  mockText: { fontSize: 13, color: '#92400E', lineHeight: 18 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 4, marginBottom: 20 },
  cardAccent: { height: 6, backgroundColor: '#4F46E5' },
  profile: { alignItems: 'center', padding: 28, gap: 8 },
  avatarImage: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#E2E8F0', marginBottom: 8 },
  avatarFallback: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarFallbackText: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  email: { fontSize: 14, color: '#475569', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: 10 },
  badgeVerified: { backgroundColor: '#ECFDF5' },
  badgeUnverified: { backgroundColor: '#FEF2F2' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotVerified: { backgroundColor: '#10B981' },
  dotUnverified: { backgroundColor: '#EF4444' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextVerified: { color: '#065F46' },
  badgeTextUnverified: { color: '#991B1B' },
  statusSection: { paddingHorizontal: 28, paddingBottom: 28, alignItems: 'center', gap: 4 },
  welcome: { fontSize: 16, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  statusText: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  logoutButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FCA5A5', paddingVertical: 13, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', alignSelf: 'center', minWidth: 160, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#B91C1C' },
});
