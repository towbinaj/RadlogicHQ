/**
 * Keyboard shortcuts for tool pages.
 * Number keys (1-9) select options in step cards / scored sections.
 * Arrow keys (Left/Right) switch between tabs.
 */
const BTNS = '.benign-choice, .deauville-score-card, .option-card';
const ACTIVE = ['benign-choice--active', 'deauville-score-card--active', 'selected'];
const CARDS = '.step-card, .score-section';

function isEditing() {
  const el = document.activeElement;
  if (!el) return false;
  const t = el.tagName;
  return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || el.isContentEditable;
}

function isActive(btn) { return ACTIVE.some((c) => btn.classList.contains(c)); }

function findTargetCard(container) {
  const cards = container.querySelectorAll(CARDS);
  for (const card of cards) {
    const buttons = card.querySelectorAll(BTNS);
    if (![...buttons].some(isActive)) return card;
  }
  return cards[0] || null;
}

function applyBadges(container) {
  container.querySelectorAll('.kb-hint').forEach((el) => el.remove());
  for (const card of container.querySelectorAll(CARDS)) {
    card.querySelectorAll(BTNS).forEach((btn, i) => {
      if (i >= 9) return;
      const badge = document.createElement('span');
      badge.className = 'kb-hint';
      badge.textContent = i + 1;
      btn.style.position = 'relative';
      btn.appendChild(badge);
    });
  }
}

/**
 * Initialize keyboard shortcuts on a tool page.
 * @param {{ container: HTMLElement }} options
 * @returns {{ destroy: () => void }}
 */
export function initKeyboardShortcuts({ container }) {
  if (!container) return { destroy() {} };

  if (!document.getElementById('kb-hint-style')) {
    const s = document.createElement('style');
    s.id = 'kb-hint-style';
    s.textContent = `.kb-hint{position:absolute;top:4px;right:6px;font-size:10px;line-height:1;font-weight:600;color:var(--text-muted);opacity:.5;pointer-events:none}@media(hover:none){.kb-hint{display:none}}`;
    document.head.appendChild(s);
  }

  let badgeTimer = null;
  const observer = new MutationObserver(() => {
    if (badgeTimer) return;
    badgeTimer = requestAnimationFrame(() => {
      observer.disconnect();
      applyBadges(container);
      observer.observe(container, { childList: true, subtree: true });
      badgeTimer = null;
    });
  });
  observer.observe(container, { childList: true, subtree: true });
  applyBadges(container);

  function onKeyDown(e) {
    if (isEditing() || e.ctrlKey || e.metaKey || e.altKey) return;

    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= 9) {
      const card = findTargetCard(container);
      if (!card) return;
      const target = card.querySelectorAll(BTNS)[num - 1];
      if (target) { e.preventDefault(); target.click(); }
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const tabs = [...document.querySelectorAll('.nodule-tab:not(.nodule-tab--add):not(.nodule-tab--remove)')];
      if (tabs.length < 2) return;
      const idx = tabs.findIndex((t) => t.classList.contains('active'));
      if (idx === -1) return;
      const next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
      e.preventDefault();
      tabs[next].click();
    }
  }

  document.addEventListener('keydown', onKeyDown);
  return {
    destroy() {
      document.removeEventListener('keydown', onKeyDown);
      observer.disconnect();
      container.querySelectorAll('.kb-hint').forEach((el) => el.remove());
    },
  };
}
