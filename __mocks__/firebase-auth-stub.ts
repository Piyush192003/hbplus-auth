export const getAuth = () => ({
  onAuthStateChanged: (fn: any) => fn({ status: 'signedOut' }),
  signInWithPopup: () => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } }),
  signOut: () => Promise.resolve(),
  currentUser: null,
  fetchProvidersForEmail: () => Promise.resolve([]),
  isSignInWithCredential: () => false,
});

export const signInWithPopup = () => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } });

export const signOut = () => Promise.resolve();

export const onAuthStateChanged = (fn: any) => fn({ status: 'signedOut' });

export const signInWithCredential = () => Promise.resolve({ user: { uid: 'uid', email: 'test@test.com', displayName: 'Test', photoURL: '', emailVerified: false, providerData: [] } });

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: any[];
};

export type Auth = ReturnType<typeof getAuth>;

export type Unsubscribe = () => void;