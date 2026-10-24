export const initializeApp = (config: any) => ({ name: '[DEFAULT]', config });
export const getApp = (name = '[DEFAULT]') => ({ name });
export const getApps = () => [];
export const getAuth = (app: any) => ({
  onAuthStateChanged: (fn: any) => fn({ status: 'signedOut' }),
  signInWithPopup: () => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } }),
  signOut: () => Promise.resolve(),
  currentUser: null,
  fetchProvidersForEmail: () => Promise.resolve([]),
  isSignInWithCredential: () => false,
});

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: any[];
};

