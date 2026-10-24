import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { FC } from 'react';
import { AuthService, SignInResult, AuthError } from '../services/authService';

export interface GoogleLoginButtonProps {
  authService: AuthService;
  onResult: (result: SignInResult) => void;
  loading?: boolean;
  testOnPress?: () => void;
}

export const GoogleLoginButton: FC<GoogleLoginButtonProps> = ({
  authService,
  onResult,
  loading = false,
  testOnPress,
}) => {
  const handlePress = async () => {
    if (testOnPress) {
      testOnPress();
      return;
    }
    const result = await authService.signInWithGoogle();
    onResult(result);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed, hovered, focused }) => [
        styles.button,
        pressed && styles.pressed,
        hovered && styles.hovered,
        focused && styles.focused,
        loading && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Sign in with Google"
      testID="google-sign-in-button"
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color="#4F46E5" />
        ) : (
          <>
            <View style={styles.icon}>
              <Text style={styles.iconText}>G</Text>
            </View>
            <Text style={styles.label}>Sign in with Google</Text>
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  hovered: {
    borderColor: '#4F46E5',
    shadowOpacity: 0.12,
  },
  focused: {
    borderColor: '#4F46E5',
  },
  disabled: {
    opacity: 0.6,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4285F4',
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
});
