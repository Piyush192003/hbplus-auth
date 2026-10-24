# HBPlus Auth

Cross-platform Google Authentication (Web + Android) built with **Expo**, **React Native**, and **Firebase Auth**.

Restricts sign-in to the exact domain **@hbplus.fit**. All other domains are blocked.

## Features

- Firebase Google sign-in via popup (Web) / native flow (Android)
- Exact domain restriction: only `@hbplus.fit` emails are accepted
- Session restore on app launch
- Sign-out with redirect back to login
- Protected dashboard for authenticated users
- Unit tests with Vitest (33 tests, all passing)
- Production web build via `expo export`

## Project Structure

```
hbplus-auth/
├── App.tsx                     # App entry point (AuthService singleton + AppNavigator)
├── app.json                    # Expo configuration
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript config (jsx: react-native)
├── vitest.config.ts            # Vitest config (esbuild jsx: automatic)
├── .env.example                # Environment variable template (copy to .env)
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
├── src/
│   ├── config/firebase.ts      # Firebase config from env vars
│   ├── services/authService.ts # Auth service: sign-in, sign-out, domain check, listener
│   ├── services/authService.test.ts
│   ├── utils/domainValidation.ts # isValidAllowedDomain (exact @hbplus.fit match)
│   ├── utils/domainValidation.test.ts
│   ├── utils/domainValidation.assignment.test.ts
│   ├── navigation/AppNavigator.tsx # Loading → Login → Dashboard router
│   ├── screens/LoginScreen.tsx     # Public login screen
│   ├── screens/DashboardScreen.tsx # Protected dashboard with sign-out
│   ├── components/GoogleLoginButton.tsx
│   ├── components/LoadingScreen.tsx
│   ├── App.test.tsx            # App-level integration tests
│   └── test-setup.ts           # Vitest setup
├── __mocks__/                  # Firebase / React Native stubs (not used by inline vi.mock)
│   ├── firebase-app-stub.ts
│   ├── firebase-auth-stub.ts
│   ├── react-native-stub.ts
│   └── react-native.ts
└── dist/                       # Production web build output (gitignored)
```

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `start` | `expo start` | Start Expo dev server |
| `web` | `expo start --web` | Start web dev server |
| `android` | `expo start --android` | Start Android dev server |
| `test` | `vitest run` | Run all unit tests |
| `test:watch` | `vitest watch` | Run tests in watch mode |
| `build:web` | `expo export` | Production web build → `dist/` |
| `lint` | `expo lint` | Run ESLint |

## Windows Setup

### 1. Prerequisites

- **Node.js** 18+ (LTS recommended): https://nodejs.org
- **Git**: https://git-scm.com
- **Expo CLI** (optional, global): `npm install -g @expo/cli`

### 2. Install Dependencies

```powershell
# Clone or extract the project, then:
cd hbplus-auth
npm install
```

This installs production dependencies (`firebase`, `react`, `react-native`, `react-native-web`, `@expo/metro-runtime`, `expo-status-bar`) and dev dependencies (`vitest`, `typescript`, `jest`, `react-test-renderer`, `jsdom`, etc.).

No manual patches to `node_modules` are required. A clean `npm install` is sufficient.

## Firebase Configuration

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (or select an existing one).
3. Enable **Authentication** > **Sign-in method** > **Google**.

### Step 2: Register a Web App

1. In Firebase Console > Project Settings > Your Apps, add a **Web app**.
2. Copy the `firebaseConfig` object values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 3: Create `.env`

Copy `.env.example` to `.env` and fill in your real Firebase values:

```powershell
Copy-Item .env.example .env
```

Then edit `.env` (it is **never committed** — it is already in `.gitignore`):

```ini
# Firebase Web config (from Firebase Console > Project Settings > Your Apps > Config)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=hbplus-auth-d7872.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=hbplus-auth-d7872
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=hbplus-auth-d7872.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=103...
EXPO_PUBLIC_FIREBASE_APP_ID=1:...

# Android — Google OAuth Android OAuth client ID (required for Android native sign-in)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=1234567890-ab12cd34ef56gh78ij90klm.apps.googleusercontent.com
```

**Do not fabricate values.** Copy them exactly from your Firebase Console. These are client-visible public API keys — safe to ship in a frontend bundle. Never add Firebase Admin service-account private keys.

### Step 4: Add Authorized Domains

In Firebase Console > Authentication > Settings > **Authorized domains**, add:
- `localhost` (for local development)
- Your production hosting domain (e.g., `your-site.netlify.app`)

## Google Sign-In

The app uses Firebase's `signInWithPopup` with `GoogleAuthProvider`:

- **Web**: Popup-based Google OAuth. No separate Google Web client ID is required — Firebase handles client selection server-side.
- **Android**: Native Google sign-in requires `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and Firebase Android app registration (SHA-1 fingerprint).

### Domain Restriction (@hbplus.fit only)

`src/utils/domainValidation.ts` enforces an **exact, case-insensitive match** against `hbplus.fit`:

- ✅ `employee@hbplus.fit` — accepted
- ❌ `user@gmail.com` — blocked
- ❌ `user@fakehbplus.fit` — blocked (substring not allowed)
- ❌ `user@sub.hbplus.fit` — blocked (subdomain not allowed)
- ❌ `@hbplus.fit` (empty local part) — blocked

The check happens in two places:
1. `authService.signInWithGoogle()` — after Firebase returns the user, before returning success.
2. `authService.emit()` — on every auth state change, including session restore.

Unauthenticated or unverified users are signed out and shown an "Access restricted" message.

## Testing

Run all unit tests:

```powershell
npm test
# or
npx vitest run
```

Expected result: **33 tests pass** across 4 test files.

| Test File | Tests |
|---|---|
| `src/utils/domainValidation.test.ts` | 16 |
| `src/utils/domainValidation.assignment.test.ts` | 9 |
| `src/services/authService.test.ts` | 3 |
| `src/App.test.tsx` | 5 |

Tests use self-contained `vi.mock()` factories for Firebase and React Native — no real credentials or network calls.

## Production Web Build

Build the static web bundle:

```powershell
npm run build:web
# or
npx expo export
```

Output goes to `dist/`:
- `_expo/static/js/web/AppEntry-<hash>.js` (~373 kB)
- `index.html`
- `metadata.json`

Deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, etc.).

### Netlify Deployment

1. Build locally: `npm run build:web`
2. Connect your GitHub repo to Netlify, or drag-and-drop the `dist/` folder.
3. Set build command: `npm run build:web`
4. Set publish directory: `dist`
5. Add environment variables in Netlify (copy from your `.env`, prefixed with `EXPO_PUBLIC_`).

**Do not push to GitHub or deploy to Netlify yet** — complete the Firebase Console setup first.

## Android Setup (Native)

For Android native Google sign-in:

1. In Firebase Console, add an **Android app** to your project.
2. Provide your app's package name and SHA-1 fingerprint.
3. Download `google-services.json` and place it in the `android/app/` directory.
4. Set `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` in `.env`.
5. Run: `npx expo start --android`

### Native OAuth Requirements

| Requirement | Details |
|---|---|
| Firebase Android app | Registered in Firebase Console with package name |
| SHA-1 fingerprint | Debug and/or release signing certificate |
| `google-services.json` | Placed in `android/app/` |
| Google client ID | Android OAuth client ID from Firebase Console |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Set in `.env` |

## Security Notes

- `.env` is in `.gitignore` — never commit real credentials.
- `serviceAccountKey.json` is in `.gitignore` — never commit Admin SDK keys.
- Firebase config values (`apiKey`, `authDomain`, etc.) are public and safe to ship in the client bundle.
- Domain validation is a frontend re-validation layer. Firebase Auth is the source of truth for authentication.
- Do not put server-side secrets in frontend code.

## Dependencies (Production)

| Package | Version | Purpose |
|---|---|---|
| `firebase` | ^11.9.0 | Firebase Auth SDK |
| `react` | 19.3.1 | React framework |
| `react-dom` | 19.3.1 | React DOM for web |
| `react-native` | 0.79.6 | React Native framework |
| `react-native-web` | ^0.21.4 | React Native web compatibility |
| `@expo/metro-runtime` | ~5.0.5 | Expo Metro runtime |
| `expo` | ~53.0.24 | Expo framework |
| `expo-status-bar` | ~2.2.3 | Status bar component |

## Dependencies (Dev)

| Package | Version | Purpose |
|---|---|---|
| `vitest` | ^3.2.4 | Test runner |
| `typescript` | ~5.8.3 | TypeScript compiler |
| `react-test-renderer` | 19.0.0 | React component testing |
| `jsdom` | ^29.1.1 | DOM environment for tests |
| `jest` | ^29.7.0 | Jest compatibility |
| `jest-expo` | ~53.0.10 | Expo Jest helpers |

## License

Private — HBPlus Auth