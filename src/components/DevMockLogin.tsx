/**
 * DevMockLogin — Development-only mock login button.
 *
 * This component is EXPLICITLY DEVELOPMENT-ONLY. It is guarded by `__DEV__`
 * and is tree-shaken / excluded from production builds. It simulates an
 * authenticated @hbplus.fit user without touching Firebase or Google OAuth.
 *
 * It must NEVER be treated as proof of successful Google OAuth — it bypasses
 * Firebase entirely and exists solely to exercise dashboard UI during local
 * development.
 */
import { FC, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AuthService, User } from '../services/authService';

export interface DevMockLoginProps {
  authService: AuthService;
  onMockSignIn: (user: User) => void;
}

/**
 * Returns true only in development builds. In production Metro strips this
 * branch entirely (dead-code elimination), so the component and its imports
 * never reach the production bundle.
 */
function isDevMode(): boolean {
  return typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
}

export const DevMockLogin: FC<DevMockLoginProps> = ({
  authService,
  onMockSignIn,
}) => {
  // If not in development mode, render nothing. This is a runtime guard in
  // addition to the build-time tree-shaking.
  if (!isDevMode()) {
    return null;
  }

  const handleMockSignIn = useCallback(() => {
    const mockUser: User = {
      uid: 'dev-mock-uid',
      email: 'dev.mock@hbplus.fit',
      emailVerified: true,
      displayName: 'Dev Mock User',
      photoURL: '',
      providerId: 'mock',
    };
    onMockSignIn(mockUser);
  }, [onMockSignIn]);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>DEVELOPMENT ONLY</Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handleMockSignIn}
        accessibilityRole="button"
        accessibilityLabel="Dev mock login (development only)"
        testID="dev-mock-login-button"
      >
        <Text style={styles.buttonText}>Dev Mock Login</Text>
      </TouchableOpacity>
      <Text style={styles.note}>
        Bypasses Google OAuth and Firebase. Not for production use.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.8,
  },
  button: {
    backgroundColor: '#64748B',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  note: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
  },
});