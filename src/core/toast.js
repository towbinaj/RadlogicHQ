/**
 * Lightweight toast notification utility.
 * Reuses a single DOM element; debounces to avoid spam.
 */

let el = null;
let hideTimer = null;
let lastShown = 0;
const COOLDOWN = 5000;

/**
 * Show a toast message at the bottom center of the screen.
 * Debounced: suppresses repeat calls within 5 seconds.
 */
export function showToast(message, duration = 3000) {
  const now = Date.now();
  if (now - lastShown < COOLDOWN) return;
  lastShown = now;

  if (!el) {
    el = document.createElement('div');
    el.className = 'toast-notification';
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--surface-2)',
      color: 'var(--text-warn, #f59e0b)',
      zIndex: '9999',
      borderRadius: '6px',
      padding: '0.5rem 1rem',
      fontSize: '0.8rem',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
    });
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.style.opacity = '1';

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    el.style.opacity = '0';
  }, duration);
}
