/**
 * Firebase Configuration — YoHo clone, STAGING backend (vee-test-staging).
 *
 * The clone reuses the EXISTING test/staging Firebase project (vee-test-staging)
 * to prove the vertical slice. It does NOT touch production (vee-chat-36720).
 *
 * The apiKey + appId below are PLACEHOLDERS. The real values live only in the
 * GitHub secret VEE_TEST_FIREBASE_CONFIG (the same secret the Vee test app's
 * prepare script uses). Before the app can sign in or read RTDB, inject the
 * real values here — same mechanism as the test app: replace apiKey + appId
 * with the secret's values. Everything else (projectId, databaseURL,
 * authDomain, storageBucket, messagingSenderId) is the staging project's
 * public config and is already correct.
 *
 * The @firebase/auth direct import (not via the 'firebase' wrapper) is used
 * because its package.json exports map has a "react-native" condition that
 * Metro can match, unlike 'firebase/auth', whose exports map lacks that
 * condition and always resolves to the browser build — which doesn't export
 * getReactNativePersistence and throws at import time on launch.
 * (Same lesson as Vee's firebase.ts.)
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-expect-error — TypeScript resolves the generic (non-RN) typings for
// '@firebase/auth', but Metro resolves the actual React Native build at
// runtime, which does export getReactNativePersistence.
import { getReactNativePersistence } from '@firebase/auth';
import { initializeAuth, getAuth, type Auth } from '@firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  // PLACEHOLDER — inject the real staging apiKey from VEE_TEST_FIREBASE_CONFIG.
  apiKey: 'STAGING-API-KEY-NOT-CONFIGURED',
  authDomain: 'vee-test-staging.firebaseapp.com',
  databaseURL:
    'https://vee-test-staging-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'vee-test-staging',
  storageBucket: 'vee-test-staging.firebasestorage.app',
  messagingSenderId: '657798429620',
  // PLACEHOLDER — inject the real staging web appId from VEE_TEST_FIREBASE_CONFIG.
  appId: '1:657798429620:web:staging-not-configured',
};

/** True when the real staging apiKey has been injected (not the placeholder). */
export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'STAGING-API-KEY-NOT-CONFIGURED';

// Prevent duplicate app initialization (hot reload safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence for React Native.
// This keeps the user logged in across app restarts.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Auth already initialized (hot reload)
  auth = getAuth(app);
}

const database: Database = getDatabase(app);

export { auth, database };
export default app;
