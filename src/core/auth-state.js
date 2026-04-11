/**
 * Shared auth state — no imports from auth.js or user-data.js.
 * Breaks the circular dependency between those two modules.
 */

let currentUser = null;
const listeners = [];

export function setCurrentUser(user) {
  currentUser = user;
}

export function getUser() {
  return currentUser;
}

export function isLoggedIn() {
  return currentUser != null;
}

export function onAuthChange(fn) {
  listeners.push(fn);
  fn(currentUser);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function notifyAuthListeners() {
  listeners.forEach((fn) => fn(currentUser));
}
