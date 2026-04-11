/**
 * Storage layer — localStorage with background Firestore sync.
 *
 * Reads/writes are always instant via localStorage.
 * When logged in, writes also sync to Firestore in the background.
 * On login, Firestore data is pulled down and merged into localStorage.
 */
import { isLoggedIn, getUser, onAuthChange } from './auth.js';
import { showToast } from './toast.js';
import { saveTemplate, loadTemplate, deleteTemplate, setPreference, getPreferences, incrementCounter } from './user-data.js';

const PREFIX = 'radtools:';

// --- Sync localStorage → Firestore on write ---

const PREF_KEYS = ['compact', 'sectionOrder:tirads', 'sizeUnit:lirads', 'sizeUnit:nodule-size', 'defaultTemplate', 'defaultUnit', 'mode:curie', 'mode:leglength', 'mode:hydronephrosis', 'mode:hip-dysplasia', 'favorites', 'hiddenTools'];

/**
 * Get a value from localStorage (synchronous, instant).
 */
export function getStored(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Set a value in localStorage + background sync to Firestore if logged in.
 */
export function setStored(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }

  // Background sync to Firestore
  if (isLoggedIn()) {
    if (key.startsWith('blockConfig:')) {
      // Template config — save to user_templates collection
      const parts = key.replace('blockConfig:', '').split(':');
      if (parts.length === 2) {
        saveTemplate(parts[0], parts[1], value).catch(() => showToast('Sync failed — changes saved locally'));
      }
    } else if (isPrefKey(key)) {
      // Preference — save to user_preferences
      setPreference(key, value).catch(() => showToast('Sync failed — changes saved locally'));
    }
  }
}

/**
 * Remove a value from localStorage + Firestore.
 */
export function removeStored(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }

  if (isLoggedIn() && key.startsWith('blockConfig:')) {
    const parts = key.replace('blockConfig:', '').split(':');
    if (parts.length === 2) {
      deleteTemplate(parts[0], parts[1]).catch(() => showToast('Sync failed — changes saved locally'));
    }
  }
}

/**
 * Increment an aggregate analytics counter (fire-and-forget).
 */
export function trackEvent(counterId) {
  incrementCounter(counterId).catch(() => {});
}

// --- Sync Firestore → localStorage on login ---

onAuthChange(async (user) => {
  if (!user) return;

  try {
    // Pull preferences from Firestore and merge into localStorage
    const prefs = await getPreferences();
    if (prefs && typeof prefs === 'object') {
      for (const [key, value] of Object.entries(prefs)) {
        const localVal = localStorage.getItem(PREFIX + key);
        if (localVal == null) {
          // Only fill in if localStorage doesn't already have it
          localStorage.setItem(PREFIX + key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      }
    }
  } catch {
    showToast('Could not sync preferences from cloud');
  }
});

function isPrefKey(key) {
  return PREF_KEYS.includes(key) || key.startsWith('sizeUnit:');
}

/**
 * Get size unit preference for a tool, falling back to global default.
 */
export function getSizeUnit(toolId) {
  return getStored(`sizeUnit:${toolId}`) ?? getStored('defaultUnit') ?? 'mm';
}
