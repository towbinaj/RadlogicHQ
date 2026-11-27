/**
 * Firebase client initialization.
 * Single shared instance used across the app.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialization must never take the calculators down with it. getAuth()
// throws synchronously on a missing/invalid API key, and an uncaught throw
// here aborts every module that imports this file -- i.e. every page goes
// blank. On failure, export null handles: calculators keep working and only
// sign-in / cloud sync are unavailable.
let app = null;
let auth = null;
let db = null;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  console.warn('[firebase] init failed; sign-in and cloud sync disabled:', err?.message || err);
  app = auth = db = null;
}

export { app, auth, db };

/** True when Firebase Auth + Firestore initialized successfully. */
export const firebaseAvailable = auth !== null && db !== null;
