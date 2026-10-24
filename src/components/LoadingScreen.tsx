import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { FC } from 'react';

export const LoadingScreen: FC = () => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.bgDecorTop} />
      <View style={styles.bgDecorBottom} />
      <View style={styles.center}>
        <View style={styles.mark}>
          <Text style={styles.markText}>HB+</Text>
        </View>
        <ActivityIndicator size="large" color="#4F46E5" style={styles.spinner} />
        <Text style={styles.title}>HBPlus</Text>
        <Text style={styles.subtitle}>Restoring your session…</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgDecorTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  bgDecorBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
  },
  center: {
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  markText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  spinner: {
    marginVertical: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
