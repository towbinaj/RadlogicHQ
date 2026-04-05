/**
 * User data layer — preferences, templates, analytics.
 * Uses Firestore when logged in, localStorage as fallback/cache.
 */
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { isLoggedIn, getUser } from './auth.js';

// ==========================================
// PREFERENCES
// ==========================================

let prefsCache = null;

/**
 * Get all user preferences.
 * @returns {Promise<Object>}
 */
export async function getPreferences() {
  if (!isLoggedIn()) return getLocalPrefs();

  if (prefsCache) return prefsCache;

  const ref = doc(db, 'user_preferences', getUser().uid);
  const snap = await getDoc(ref);
  prefsCache = snap.exists() ? snap.data().preferences || {} : {};
  return prefsCache;
}

/**
 * Set a single preference key.
 */
export async function setPreference(key, value) {
  // Always save locally (cache)
  setLocalPref(key, value);

  if (!isLoggedIn()) return;

  const prefs = await getPreferences();
  prefs[key] = value;
  prefsCache = prefs;

  const ref = doc(db, 'user_preferences', getUser().uid);
  await setDoc(ref, { preferences: prefs }, { merge: true });
}

/**
 * Get a single preference.
 */
export async function getPreference(key, fallback = null) {
  const prefs = await getPreferences();
  return prefs[key] ?? fallback;
}

// ==========================================
// TEMPLATES
// ==========================================

/**
 * Save a custom template config for a tool + template ID.
 */
export async function saveTemplate(toolId, templateId, config) {
  // Always cache locally
  const localKey = `blockConfig:${toolId}:${templateId}`;
  try {
    localStorage.setItem(`radtools:${localKey}`, JSON.stringify(config));
  } catch { /* ignore */ }

  if (!isLoggedIn()) return;

  const uid = getUser().uid;
  const ref = doc(db, 'user_templates', `${uid}_${toolId}_${templateId}`);
  await setDoc(ref, {
    userId: uid,
    toolId,
    templateId,
    config,
    shareCode: null,
  }, { merge: true });
}

/**
 * Load a custom template config.
 */
export async function loadTemplate(toolId, templateId) {
  if (!isLoggedIn()) {
    return loadLocalTemplate(toolId, templateId);
  }

  const uid = getUser().uid;
  const ref = doc(db, 'user_templates', `${uid}_${toolId}_${templateId}`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().config;
  }
  return loadLocalTemplate(toolId, templateId);
}

/**
 * Delete a custom template (reset to default).
 */
export async function deleteTemplate(toolId, templateId) {
  // Clear local
  const localKey = `blockConfig:${toolId}:${templateId}`;
  localStorage.removeItem(`radtools:${localKey}`);

  if (!isLoggedIn()) return;

  const uid = getUser().uid;
  const ref = doc(db, 'user_templates', `${uid}_${toolId}_${templateId}`);
  await deleteDoc(ref);
}

/**
 * Generate a share code for a template.
 */
export async function shareTemplate(toolId, templateId) {
  if (!isLoggedIn()) return null;

  const uid = getUser().uid;
  const ref = doc(db, 'user_templates', `${uid}_${toolId}_${templateId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const code = crypto.randomUUID().slice(0, 8);
  await setDoc(ref, { shareCode: code }, { merge: true });
  return code;
}

/**
 * Load a shared template by share code.
 */
export async function loadSharedTemplate(shareCode) {
  const q = query(collection(db, 'user_templates'), where('shareCode', '==', shareCode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return { toolId: data.toolId, templateId: data.templateId, config: data.config };
}

// ==========================================
// ANALYTICS (aggregate only — no PII)
// ==========================================

/**
 * Increment an aggregate counter.
 * No user ID, no timestamp, no IP.
 */
export async function incrementCounter(counterId) {
  try {
    const ref = doc(db, 'analytics_aggregate', counterId);
    const snap = await getDoc(ref);
    const current = snap.exists() ? snap.data().count || 0 : 0;
    await setDoc(ref, { count: current + 1 });
  } catch {
    // Analytics failure is silent — never block the user
  }
}

// ==========================================
// MIGRATION: localStorage → Firestore
// ==========================================

/**
 * On first login, migrate existing localStorage prefs to Firestore.
 * Only runs once (sets a migration flag).
 */
export async function migrateLocalStorageToCloud(uid) {
  const migrated = localStorage.getItem('radtools:migrated_to_cloud');
  if (migrated === uid) return; // Already migrated for this user

  const localPrefs = getLocalPrefs();
  if (Object.keys(localPrefs).length > 0) {
    const ref = doc(db, 'user_preferences', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // First time — migrate
      await setDoc(ref, { preferences: localPrefs });
      prefsCache = localPrefs;
    }
  }

  // Migrate block configs
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('radtools:blockConfig:')) {
      const parts = key.replace('radtools:blockConfig:', '').split(':');
      if (parts.length === 2) {
        const [toolId, templateId] = parts;
        try {
          const config = JSON.parse(localStorage.getItem(key));
          const ref = doc(db, 'user_templates', `${uid}_${toolId}_${templateId}`);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, { userId: uid, toolId, templateId, config, shareCode: null });
          }
        } catch { /* skip malformed */ }
      }
    }
  }

  localStorage.setItem('radtools:migrated_to_cloud', uid);
}

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

function getLocalPrefs() {
  const prefs = {};
  const keys = ['compact', 'sizeUnit:lirads', 'sectionOrder:tirads'];
  for (const key of keys) {
    const val = localStorage.getItem(`radtools:${key}`);
    if (val != null) {
      try { prefs[key] = JSON.parse(val); } catch { prefs[key] = val; }
    }
  }
  // Also check sizeUnit keys from renderer
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('radtools:sizeUnit:')) {
      prefs[k.replace('radtools:', '')] = localStorage.getItem(k);
    }
  }
  return prefs;
}

function setLocalPref(key, value) {
  try {
    localStorage.setItem(`radtools:${key}`, typeof value === 'string' ? value : JSON.stringify(value));
  } catch { /* ignore */ }
}

function loadLocalTemplate(toolId, templateId) {
  try {
    const raw = localStorage.getItem(`radtools:blockConfig:${toolId}:${templateId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
