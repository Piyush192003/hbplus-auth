/**
 * Firebase Web Configuration
 *
 * IMPORTANT:
 * 1. Copy this project's .env.example to .env and fill in the values.
 * 2. These values come from Firebase Console > Project Settings > Your Apps > Config.
 * 3. NEVER commit real credentials. .env is already in .gitignore.
 * 4. These are safe to ship in a client bundle: the Web SDK is public API.
 *    Do NOT put any server-side/private keys here.
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
