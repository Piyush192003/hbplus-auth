/**
 * Firebase Authentication service for HBPlus Auth.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithCredential,
  User,
  OAuthProvider,
  GoogleAuthProvider,
  Auth,
  Unsubscribe,
} from 'firebase/auth';
import { firebaseConfig } from '../config/firebase';
import { isValidAllowedDomain, normalizeEmail } from '../utils/domainValidation';

export { User, Auth, Unsubscribe };

export type AuthError =
  | { kind: 'cancelled' }
  | { kind: 'blocked' }
  | { kind: 'unauthorized'; domain: string }
  | { kind: 'userNotFound' }
  | { kind: 'custom'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'unknown'; message: string };

export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User; email: string; isVerified: boolean }
  | { status: 'signedOut' }
  | { status: 'unauthorized'; email: string; isVerified: boolean };

export type SignInResult =
  | { success: true; user: User }
  | { success: false; error: AuthError };

function isFirebaseError(err: unknown): err is { code: string; message?: string } {
  return typeof (err as { code: string }).code === 'string';
}

function isCanceledError(err: unknown): boolean {
  if (!isFirebaseError(err)) return false;
  const code = err.code;
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  );
}

function mapFirebaseError(err: unknown): AuthError {
  if (!isFirebaseError(err)) {
    return { kind: 'unknown', message: String(err instanceof Error ? err.message : String(err)) };
  }
  const { code, message } = err;
  if (code === 'auth/invalid-credential' || code === 'auth/popup-blocked') {
    return { kind: 'network', message: message ?? code };
  }
  if (code === 'auth/too-many-requests') {
    return { kind: 'network', message: 'Too many attempts. Please try again later.' };
  }
  if (code === 'auth/network-request-failed') {
    return { kind: 'network', message: 'Network error. Please check your connection.' };
  }
  return { kind: 'unknown', message: message ?? code };
}

export class AuthService {
  private app: FirebaseApp;
  private auth: Auth;
  private listeners: Set<(state: AuthState) => void> = new Set();
  private firebaseUnsubscribe: Unsubscribe | null = null;
  private initError = false;
  private initialLoadTimer: ReturnType<typeof setTimeout> | null = null;
  private lastState: AuthState | null = null;
  listenerCallback: ((state: AuthState) => void) | null = null;

  constructor() {
    console.log('[AuthService] init: start', JSON.stringify({ apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.slice(0, 6) + '...' : undefined, authDomain: firebaseConfig.authDomain, projectId: firebaseConfig.projectId }));
    // Use getApps() to avoid FirebaseError when no app exists (test environments).
    // In production, the singleton app was initialized at module load time.
    let existing;
    try {
      existing = getApps().find((a) => a.name === '[DEFAULT]');
    } catch {
      existing = null;
    }
    try {
      this.app = existing ?? initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      console.log('[AuthService] init: success', { hasAuth: !!this.auth });
    } catch (err) {
      console.error('[AuthService] init: FAILED', err);
      this.initError = true;
      this.lastState = { status: 'signedOut' };
      this.app = null as unknown as FirebaseApp;
      this.auth = null as unknown as Auth;
    }
  }

  listen(callback: (state: AuthState) => void): Unsubscribe {
    console.log('[AuthService] listen: register', { listenersBefore: this.listeners.size });
    this.listeners.add(callback);
    this.syncListenerCallback();
    if (this.initError) {
      console.log('[AuthService] listen: initError path -> emit signedOut');
      this.lastState = { status: 'signedOut' };
      this.listenerCallback?.({ status: 'signedOut' });
      const unsubscribe = () => {
        this.listeners.delete(callback);
        if (this.listeners.size === 0) {
          this.listenerCallback = null;
        } else {
          this.syncListenerCallback();
        }
      };
      return unsubscribe;
    }
    if (!this.firebaseUnsubscribe) {
      // Bound the wait for Firebase's initial auth state. If the modular
      // onAuthStateChanged never emits (e.g. persistence init hang), leave
      // loading by emitting signedOut instead of spinning forever.
      this.initialLoadTimer = setTimeout(() => {
        console.warn('[AuthService] onAuthStateChanged: no initial state within 5s -> emit signedOut');
        this.lastState = { status: 'signedOut' };
        this.listenerCallback?.({ status: 'signedOut' });
        this.initialLoadTimer = null;
      }, 5000);
      try {
        this.firebaseUnsubscribe = firebaseOnAuthStateChanged(
          this.auth,
          (user) => {
            console.log('[AuthService] onAuthStateChanged: fired', { hasUser: !!user, uid: (user as any)?.uid, email: (user as any)?.email });
            this.emit(user);
          },
          (err) => {
            console.error('[AuthService] onAuthStateChanged: error', err);
            if (this.initialLoadTimer) { clearTimeout(this.initialLoadTimer); this.initialLoadTimer = null; }
            this.lastState = { status: 'signedOut' };
            this.listenerCallback?.({ status: 'signedOut' });
          },
        );
        console.log('[AuthService] listen: firebase listener registered', { hasUnsubscribe: !!this.firebaseUnsubscribe });
      } catch (err) {
        console.error('[AuthService] listen: registration FAILED', err);
        if (this.initialLoadTimer) { clearTimeout(this.initialLoadTimer); this.initialLoadTimer = null; }
        this.listenerCallback?.({ status: 'signedOut' });
        this.firebaseUnsubscribe = null;
      }
    } else {
      console.log('[AuthService] listen: reusing existing firebase listener');
    }
    // Late subscribers (e.g. LoginScreen mounting after AppNavigator already
    // received the initial state) never get a Firebase callback because the
    // listener was registered once. Replay the last known state so they do
    // not stay stuck in `loading`.
    if (this.lastState) {
      console.log('[AuthService] listen: replay lastState to late subscriber', this.lastState.status);
      callback(this.lastState);
    }
    const unsubscribe = () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        if (this.firebaseUnsubscribe) {
          this.firebaseUnsubscribe();
          this.firebaseUnsubscribe = null;
        }
        this.listenerCallback = null;
      } else {
        this.syncListenerCallback();
      }
    };
    return unsubscribe;
  }

  unlisten(): void {
    this.listeners.clear();
    if (this.initialLoadTimer) { clearTimeout(this.initialLoadTimer); this.initialLoadTimer = null; }
    if (this.firebaseUnsubscribe) {
      this.firebaseUnsubscribe();
      this.firebaseUnsubscribe = null;
    }
    this.listenerCallback = null;
  }

  private syncListenerCallback(): void {
    if (this.listeners.size === 0) {
      this.listenerCallback = null;
      return;
    }
    this.listenerCallback = (state: AuthState) => {
      for (const cb of this.listeners) {
        cb(state);
      }
    };
  }


  private emit(user: User | null): void {
    if (this.initialLoadTimer) { clearTimeout(this.initialLoadTimer); this.initialLoadTimer = null; }
    console.log('[AuthService] emit: start', { hasUser: !!user });
    if (!user) {
      console.log('[AuthService] emit: no user -> signedOut');
      this.lastState = { status: 'signedOut' };
      this.listenerCallback?.({ status: 'signedOut' });
      return;
    }

    const email = user.email ?? '';
    const isVerified = user.emailVerified;

    if (!isValidAllowedDomain(email)) {
      void this.signOut().finally(() => {
        this.lastState = {
          status: 'unauthorized',
          email: normalizeEmail(email),
          isVerified: false,
        };
        this.listenerCallback?.({
          status: 'unauthorized',
          email: normalizeEmail(email),
          isVerified: false,
        });
      });
      return;
    }

    if (isVerified) {
      this.lastState = {
        status: 'authenticated',
        user,
        email: normalizeEmail(email),
        isVerified: true,
      };
      this.listenerCallback?.({
        status: 'authenticated',
        user,
        email: normalizeEmail(email),
        isVerified: true,
      });
    } else {
      void this.signOut().finally(() => {
        this.lastState = {
          status: 'unauthorized',
          email: normalizeEmail(email),
          isVerified: false,
        };
        this.listenerCallback?.({
          status: 'unauthorized',
          email: normalizeEmail(email),
          isVerified: false,
        });
      });
    }
  }

  async signInWithGoogle(): Promise<SignInResult> {
    if (this.initError || !this.auth) {
      return { success: false, error: { kind: 'network', message: 'Auth not initialized.' } };
    }
    try {
      const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
      const user = result.user;

      if (!isValidAllowedDomain(user.email ?? '')) {
        await this.signOut();
        return {
          success: false,
          error: { kind: 'blocked', domain: user.email ?? '' },
        };
      }

      return { success: true, user };
    } catch (err) {
      if (isCanceledError(err)) {
        return { success: false, error: { kind: 'cancelled' } };
      }
      return { success: false, error: mapFirebaseError(err) };
    }
  }

  signInWithIdToken(idToken: string): Promise<SignInResult> {
    if (this.initError || !this.auth) {
      return Promise.resolve({ success: false, error: { kind: 'network', message: 'Auth not initialized.' } });
    }
    if (!idToken || idToken.trim() === '') {
      return Promise.resolve({
        success: false,
        error: { kind: 'unknown', message: 'Missing Google ID token.' },
      });
    }
    return signInWithCredential(this.auth, GoogleAuthProvider.credential(idToken)).then(
      (result) => {
        const user = result.user;
        if (!isValidAllowedDomain(user.email ?? '')) {
          void this.signOut();
          return { success: false, error: { kind: 'blocked', domain: user.email ?? '' } };
        }
        return { success: true, user };
      },
      (err) => {
        if (isCanceledError(err)) {
          return { success: false, error: { kind: 'cancelled' } };
        }
        return { success: false, error: mapFirebaseError(err) };
      },
    );
  }

  async signOut(): Promise<void> {
    if (this.initError || !this.auth) return;
    await firebaseSignOut(this.auth);
  }

  get currentUser(): User | null {
    if (this.initError || !this.auth) return null;
    return this.auth.currentUser ?? null;
  }
}
