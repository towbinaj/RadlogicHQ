/**
 * User data layer — preferences, templates, analytics.
 * Uses Firestore when logged in, localStorage as fallback/cache.
 */
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, increment } from 'firebase/firestore';
import { db } from './firebase.js';
import { isLoggedIn, getUser } from './auth-state.js';

// ==========================================
// PREFERENCES
// ==========================================

let prefsCache = null;

/**
 * Clear caches on sign-out. Called from auth.js.
 */
export function clearUserDataCache() {
  prefsCache = null;
}

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
 * Get all custom templates for the current user.
 * @returns {Promise<Array<{toolId, templateId, config}>>}
 */
export async function getAllTemplates() {
  if (!isLoggedIn()) return [];

  const uid = getUser().uid;
  const q = query(collection(db, 'user_templates'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { toolId: data.toolId, templateId: data.templateId, config: data.config };
  });
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
// SAVED REPORTS (text only — no PHI, no timestamps)
// ==========================================

/**
 * Save a report to history. Requires login.
 * @param {string} toolId
 * @param {string} reportText
 * @param {string} label - User-visible label
 * @returns {Promise<string|null>} Document ID if saved
 */
export async function saveReport(toolId, reportText, label) {
  if (!isLoggedIn()) return null;

  const uid = getUser().uid;
  const id = crypto.randomUUID();
  const ref = doc(db, 'saved_reports', id);
  await setDoc(ref, {
    userId: uid,
    toolId,
    reportText,
    label: label || `${toolId} report`,
  });
  return id;
}

/**
 * Get all saved reports for the current user, optionally filtered by tool.
 * @param {string} [toolId] - Filter by tool (optional)
 * @returns {Promise<Array>}
 */
export async function getSavedReports(toolId) {
  if (!isLoggedIn()) return [];

  const uid = getUser().uid;
  const constraints = [where('userId', '==', uid)];
  if (toolId) constraints.push(where('toolId', '==', toolId));

  const q = query(collection(db, 'saved_reports'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Delete a saved report.
 */
export async function deleteSavedReport(reportId) {
  if (!isLoggedIn()) return;
  await deleteDoc(doc(db, 'saved_reports', reportId));
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
    await setDoc(ref, { count: increment(1) }, { merge: true });
  } catch {
    // Analytics failure is silent — never block the user
  }
}

// ==========================================
// GDPR: DATA EXPORT + DELETION
// ==========================================

/**
 * Export all user data as a JSON object.
 */
export async function exportAllUserData() {
  if (!isLoggedIn()) return {};
  const uid = getUser().uid;

  const profile = await getDoc(doc(db, 'profiles', uid));
  const prefs = await getDoc(doc(db, 'user_preferences', uid));

  const templatesQ = query(collection(db, 'user_templates'), where('userId', '==', uid));
  const templatesSnap = await getDocs(templatesQ);
  const templates = templatesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const reportsQ = query(collection(db, 'saved_reports'), where('userId', '==', uid));
  const reportsSnap = await getDocs(reportsQ);
  const reports = reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    profile: profile.exists() ? profile.data() : null,
    preferences: prefs.exists() ? prefs.data() : null,
    templates,
    savedReports: reports,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Delete all user data from Firestore (GDPR right to erasure).
 */
export async function deleteAllUserData() {
  if (!isLoggedIn()) return;
  const uid = getUser().uid;

  // Delete profile
  await deleteDoc(doc(db, 'profiles', uid));

  // Delete preferences
  await deleteDoc(doc(db, 'user_preferences', uid));

  // Delete all templates
  const templatesQ = query(collection(db, 'user_templates'), where('userId', '==', uid));
  const templatesSnap = await getDocs(templatesQ);
  for (const d of templatesSnap.docs) await deleteDoc(d.ref);

  // Delete all saved reports
  const reportsQ = query(collection(db, 'saved_reports'), where('userId', '==', uid));
  const reportsSnap = await getDocs(reportsQ);
  for (const d of reportsSnap.docs) await deleteDoc(d.ref);

  // Clear local storage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('radtools:')) localStorage.removeItem(key);
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
