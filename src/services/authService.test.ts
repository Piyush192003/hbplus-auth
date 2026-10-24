import { describe, it, expect, vi } from 'vitest';
import { signInWithPopup } from 'firebase/auth';

// Firebase v9 modular API mocks — fully self-contained factories to avoid hoisting issues.
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn((config: any) => ({ name: '[DEFAULT]', config })),
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  getApps: vi.fn(() => []),
  getAuth: vi.fn(() => ({
    onAuthStateChanged: vi.fn((fn: any) => fn(null)),
    signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } })),
    signOut: vi.fn(() => Promise.resolve()),
    currentUser: null,
    fetchProvidersForEmail: vi.fn(() => Promise.resolve([])),
    isSignInWithCredential: vi.fn(() => false),
  })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    onAuthStateChanged: vi.fn((fn: any) => fn(null)),
    signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } })),
    signOut: vi.fn(() => Promise.resolve()),
    currentUser: null,
    fetchProvidersForEmail: vi.fn(() => Promise.resolve([])),
    isSignInWithCredential: vi.fn(() => false),
  })),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((auth: any, next: any) => { next(null); return () => {}; }),
  signInWithCredential: vi.fn(() => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } })),
  GoogleAuthProvider: vi.fn(() => ({})),
  OAuthProvider: vi.fn(() => ({})),
  User: Symbol('User'),
  Auth: Symbol('Auth'),
  Unsubscribe: Symbol('Unsubscribe'),
}));

import {
  AuthService,
  AuthState,
  User,
} from './authService';

describe('AuthService unit tests', () => {
  it('leaves loading state (emits signedOut) when Firebase init failed', () => {
    const service = new AuthService();
    (service as any).initError = true;
    const listenerFn = vi.fn();
    const unsubscribe = service.listen(listenerFn);
    expect(listenerFn).toHaveBeenCalledWith({ status: 'signedOut' });
    unsubscribe();
  });
  it('emits signedOut on startup when Firebase reports no user', () => {
    const service = new AuthService();
    const listenerFn = vi.fn();
    service.listen(listenerFn);
    // The mocked onAuthStateChanged fires null synchronously, so the app
    // must leave the loading state with a signedOut event.
    expect(listenerFn).toHaveBeenCalledWith({ status: 'signedOut' });
  });

  it('creates an AuthService instance', () => {
    const service = new AuthService();
    expect(service).toBeDefined();
  });

  it('has initial signedOut state', () => {
    const service = new AuthService();
    // In test environment, getApps() returns empty array, so service initializes with default app
    const state = service.currentUser;
    expect(state).toBeNull();
  });

  it('surfaces cancellation as a UI error', async () => {
    const service = new AuthService();
    const listenerFn = vi.fn();
    service.listen(listenerFn);
    // Make signInWithPopup throw a Firebase popup-cancelled error.
    vi.mocked(signInWithPopup).mockRejectedValueOnce({
      code: 'auth/popup-closed-by-user',
      message: 'Popup closed by user',
    });
    const result = await service.signInWithGoogle();
    expect(result.success).toBe(false);
    expect(result.error.kind).toBe('cancelled');
  });
});