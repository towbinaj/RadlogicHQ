const PREFIX = 'radtools:';

/**
 * Get a value from localStorage.
 * @param {string} key
 * @param {*} fallback - Default value if not found
 * @returns {*}
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
 * Set a value in localStorage.
 * @param {string} key
 * @param {*} value
 */
export function setStored(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Remove a value from localStorage.
 * @param {string} key
 */
export function removeStored(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}
