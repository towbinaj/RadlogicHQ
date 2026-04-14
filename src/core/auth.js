/**
 * Authentication module.
 * Email/password + Google OAuth via Firebase Auth.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  deleteUser,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { setCurrentUser, notifyAuthListeners } from './auth-state.js';
import { migrateLocalStorageToCloud, clearUserDataCache } from './user-data.js';

// Re-export auth state accessors for backward compatibility
export { onAuthChange, getUser, isLoggedIn } from './auth-state.js';

const googleProvider = new GoogleAuthProvider();

// --- Auth state listener ---

onAuthStateChanged(auth, async (user) => {
  setCurrentUser(user);
  if (user) {
    await ensureProfile(user);
    await migrateLocalStorageToCloud(user.uid);
  } else {
    clearUserDataCache();
  }
  notifyAuthListeners();
});

// --- Sign in/up/out ---

export async function signInWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: friendlyError(error) };
  }
}

export async function signUpWithEmail(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: friendlyError(error) };
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: friendlyError(error) };
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

/**
 * Update the signed-in user's password.
 * Requires the current password for re-authentication, per Firebase's
 * "recent login" requirement for sensitive operations. Works only for
 * accounts with an email/password provider — OAuth-only accounts (e.g.
 * Google sign-in) don't have a password to change here.
 */
export async function updateUserPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) return { error: 'Not signed in.' };
  if (!user.email) return { error: 'This account has no password to change.' };
  const hasPasswordProvider = user.providerData.some(
    (p) => p.providerId === 'password'
  );
  if (!hasPasswordProvider) {
    return {
      error:
        'This account signs in with Google. Manage your password through your Google account.',
    };
  }
  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    return { error: null };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  await deleteUser(user);
}

// --- Profile ---

async function ensureProfile(user) {
  const ref = doc(db, 'profiles', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email || '',
      displayName: user.displayName || '',
    });
  }
}

// --- Helpers ---

function friendlyError(error) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/requires-recent-login': 'For security, please sign out and back in, then try again.',
  };
  return map[error.code] || error.message;
}
