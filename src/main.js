import './styles/base.css';
import './styles/forms.css';
import './components/auth-ui.js';
import { toolsRegistry, getModalityLabel, getActiveLabels, MODALITIES } from './data/tools-registry.js';
import { loadSharedTemplate } from './core/user-data.js';
import { isLoggedIn } from './core/auth.js';
import { copyToClipboard } from './core/clipboard.js';
import { getStored, setStored, getToolDisplayName, setToolDisplayName } from './core/storage.js';

// Landing page styles
const style = document.createElement('style');
style.textContent = `
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-lg);
    padding-top: var(--space-xl);
    padding-bottom: var(--space-2xl);
  }

  .tool-card {
    position: relative;
    display: flex;
    gap: var(--space-md);
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    text-decoration: none;
    text-align: left;
    color: inherit;
    transition: all var(--transition-base);
  }

  a.tool-card:hover {
    border-color: var(--accent);
    background: var(--bg-elevated);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    text-decoration: none;
  }

  .tool-card--coming-soon {
    opacity: 0.5;
    cursor: default;
  }

  .tool-card__icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-subtle);
    color: var(--accent);
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: var(--text-lg);
  }


  .tool-card__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .tool-card__title {
    font-size: var(--text-lg);
    font-weight: 600;
  }

  .tool-card__desc {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .tool-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: var(--space-xs);
  }

  .tool-card__label {
    font-size: 0.65rem;
    font-weight: 500;
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    background: var(--bg-input);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .tool-card__label:hover {
    background: var(--bg-elevated);
    border-color: var(--text-muted);
  }

  .tool-card__label--body { color: var(--info); border-color: rgba(96, 165, 250, 0.3); }
  .tool-card__label--modality { color: var(--success); border-color: rgba(52, 211, 153, 0.3); }
  .tool-card__label--specialty { color: var(--warning); border-color: rgba(251, 191, 36, 0.3); }

  /* Drag-and-drop */
  .tool-card--dragging {
    opacity: 0.3;
  }

  .tool-card--dragover {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-subtle);
  }

  .tool-card--touch-clone {
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    opacity: 0.85;
    transform: scale(0.95);
    box-shadow: var(--shadow-lg);
    transition: none;
  }

  .tool-card__badge {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-muted);
    background: var(--bg-input);
    padding: 2px var(--space-sm);
    border-radius: var(--radius-sm);
  }

  /* --- Filter bar --- */
  .filter-bar {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding-top: var(--space-xl);
    max-width: 100%;
    box-sizing: border-box;
  }

  .filter-bar__search {
    flex: 1 1 auto;
    min-width: 150px;
    padding: 6px var(--space-md);
    font-size: var(--text-sm);
    font-family: var(--font-sans);
    color: var(--text-primary);
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .filter-bar__search:focus {
    border-color: var(--border-focus);
  }

  .filter-bar__search::placeholder {
    color: var(--text-muted);
  }

  .filter-bar__select {
    padding: 6px var(--space-sm);
    font-size: var(--text-xs);
    font-family: var(--font-sans);
    color: var(--text-secondary);
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    outline: none;
    cursor: pointer;
    transition: border-color var(--transition-fast);
    flex: 0 0 auto;
    width: auto;
  }

  .filter-bar__select:focus {
    border-color: var(--border-focus);
  }

  .filter-bar__clear {
    font-size: var(--text-xs);
    color: var(--text-accent);
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
    padding: 6px 4px;
    display: none;
    white-space: nowrap;
    flex: 0 0 auto;
  }

  .filter-bar__clear.visible {
    display: inline-block;
  }

  .filter-bar__clear:hover {
    text-decoration: underline;
  }

  .tools-grid__empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: var(--space-2xl) var(--space-md);
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  /* --- Favorites & hide --- */
  .tool-card__actions {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
    display: flex;
    gap: 2px;
    opacity: 0.3;
    transition: opacity var(--transition-fast);
  }

  .tool-card:hover .tool-card__actions,
  .tool-card__actions:has(.tool-card__fav--active) {
    opacity: 1;
  }

  .tool-card__fav,
  .tool-card__hide {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 2px 4px;
    line-height: 1;
    color: var(--text-muted);
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
  }

  .tool-card__fav:hover { color: var(--warning); }
  .tool-card__fav--active { color: var(--warning); opacity: 1; }
  .tool-card__rename {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 2px 4px;
    line-height: 1;
    color: var(--text-muted);
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
  }
  .tool-card__rename:hover { color: var(--accent); }
  .tool-card__rename svg { display: block; }

  .tool-card__title-input {
    font-size: var(--text-lg);
    font-weight: 600;
    font-family: var(--font-sans);
    color: var(--text-primary);
    background: var(--bg-input);
    border: 1px solid var(--accent);
    border-radius: var(--radius-sm);
    padding: 0 var(--space-xs);
    width: 100%;
    outline: none;
  }

  .tool-card__title--custom {
    color: var(--accent);
  }

  .tool-card__hide:hover { color: var(--text-secondary); }
  .tool-card__hide svg { display: block; }

  .tool-card--hidden-revealed {
    border-color: var(--warning);
    opacity: 0.7;
  }

  .tool-card--hidden-revealed .tool-card__hide {
    color: var(--warning);
    opacity: 1;
  }

  .tool-card--hidden-revealed .tool-card__actions {
    opacity: 1;
  }

  .filter-bar__favs-toggle {
    padding: 6px var(--space-sm);
    font-size: var(--text-xs);
    font-family: var(--font-sans);
    color: var(--text-muted);
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .filter-bar__favs-toggle--active {
    color: var(--warning);
    border-color: var(--warning);
    background: rgba(251, 191, 36, 0.1);
  }

  /* --- Mobile responsive --- */
  @media (max-width: 768px) {
    .filter-bar {
      flex-wrap: wrap;
    }

    .filter-bar__search {
      flex: 1 1 100%;
      min-width: 0;
    }

    .filter-bar__select {
      flex: 1 1 0;
      min-width: 0;
      font-size: 0.65rem;
    }

    .filter-bar__favs-toggle {
      font-size: 0.65rem;
    }

    .tool-card__desc {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .tool-card__label {
      font-size: 0.7rem;
      padding: 4px 8px;
    }
  }
`;
document.head.appendChild(style);

// Build filter bar + tool cards
const grid = document.getElementById('tools-grid');
if (grid) {
  const activeLabels = getActiveLabels();

  // --- Filter bar ---
  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';

  // Search input
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'filter-bar__search';
  searchInput.placeholder = 'Search tools\u2026';
  filterBar.appendChild(searchInput);

  // Dropdown filters
  function buildSelect(label, items, mapFn) {
    const select = document.createElement('select');
    select.className = 'filter-bar__select';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = label;
    select.appendChild(defaultOpt);
    for (const item of items) {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = mapFn ? mapFn(item) : item;
      select.appendChild(opt);
    }
    select.addEventListener('change', applyFilters);
    return select;
  }

  // Sort dropdown
  const sortSelect = document.createElement('select');
  sortSelect.className = 'filter-bar__select';
  for (const [val, label] of [['alpha', 'A-Z'], ['recent', 'Recent'], ['frequent', 'Most Used'], ['custom', 'Custom']]) {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    sortSelect.appendChild(opt);
  }
  sortSelect.value = getStored('toolSort', 'alpha');
  sortSelect.addEventListener('change', () => {
    setStored('toolSort', sortSelect.value);
    sortCards();
    applyFilters();
  });
  filterBar.appendChild(sortSelect);

  // Favorites-only toggle
  const favsToggle = document.createElement('button');
  favsToggle.type = 'button';
  favsToggle.className = 'filter-bar__favs-toggle';
  favsToggle.textContent = '\u2605 Favorites';
  favsToggle.addEventListener('click', () => {
    favsToggle.classList.toggle('filter-bar__favs-toggle--active');
    applyFilters();
  });
  filterBar.appendChild(favsToggle);

  const modalitySelect = buildSelect('Modality', activeLabels.modalities, getModalityLabel);
  const bodySelect = buildSelect('Body Part', activeLabels.bodyParts);
  const specialtySelect = buildSelect('Specialty', activeLabels.specialties);
  filterBar.appendChild(modalitySelect);
  filterBar.appendChild(bodySelect);
  filterBar.appendChild(specialtySelect);

  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'filter-bar__clear';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    modalitySelect.value = '';
    bodySelect.value = '';
    specialtySelect.value = '';
    favsToggle.classList.remove('filter-bar__favs-toggle--active');
    sortCards();
    applyFilters();
  });
  filterBar.appendChild(clearBtn);

  // "Show hidden" toggle
  const hiddenToggle = document.createElement('button');
  hiddenToggle.type = 'button';
  hiddenToggle.className = 'filter-bar__clear';
  hiddenToggle.style.display = 'none';
  hiddenToggle.addEventListener('click', () => {
    hiddenToggle.classList.toggle('filter-bar__favs-toggle--active');
    updateHiddenToggle();
    applyFilters();
  });
  filterBar.appendChild(hiddenToggle);

  function updateHiddenToggle() {
    if (hiddenTools.length > 0) {
      const showing = hiddenToggle.classList.contains('filter-bar__favs-toggle--active');
      hiddenToggle.textContent = showing ? 'Hide hidden' : `Show ${hiddenTools.length} hidden`;
      hiddenToggle.style.display = 'inline-block';
    } else {
      hiddenToggle.style.display = 'none';
      hiddenToggle.classList.remove('filter-bar__favs-toggle--active');
    }
  }

  grid.parentNode.insertBefore(filterBar, grid);

  // --- Favorites, hidden, usage, order state ---
  let favorites = getStored('favorites', []);
  let hiddenTools = getStored('hiddenTools', []);
  let toolUsage = getStored('toolUsage', {}); // {toolId: {count, lastUsed (sequence#)}}
  let toolOrder = getStored('toolOrder', []); // [toolId, ...] for custom sort
  let _usageSeq = Math.max(0, ...Object.values(toolUsage).map((e) => e.lastUsed || 0));

  function trackToolUse(toolId) {
    const entry = toolUsage[toolId] || { count: 0, lastUsed: 0 };
    entry.count++;
    entry.lastUsed = ++_usageSeq;
    toolUsage[toolId] = entry;
    setStored('toolUsage', toolUsage);
  }

  function toggleFavorite(toolId) {
    const idx = favorites.indexOf(toolId);
    if (idx >= 0) favorites.splice(idx, 1);
    else favorites.push(toolId);
    setStored('favorites', favorites);
    sortCards();
    applyFilters();
  }

  function toggleHidden(toolId) {
    const idx = hiddenTools.indexOf(toolId);
    if (idx >= 0) hiddenTools.splice(idx, 1);
    else hiddenTools.push(toolId);
    setStored('hiddenTools', hiddenTools);
    updateHiddenToggle();
    applyFilters();
  }

  function sortCards() {
    const mode = sortSelect.value;

    cards.sort((a, b) => {
      // Favorites always float to top
      const aFav = favorites.includes(a._tool.id);
      const bFav = favorites.includes(b._tool.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      if (aFav && bFav) return favorites.indexOf(a._tool.id) - favorites.indexOf(b._tool.id);

      // Then sort non-favorites by selected mode
      if (mode === 'recent') {
        const aTime = toolUsage[a._tool.id]?.lastUsed || 0;
        const bTime = toolUsage[b._tool.id]?.lastUsed || 0;
        if (aTime !== bTime) return bTime - aTime; // newest first
        return a._tool.name.localeCompare(b._tool.name);
      }
      if (mode === 'frequent') {
        const aCount = toolUsage[a._tool.id]?.count || 0;
        const bCount = toolUsage[b._tool.id]?.count || 0;
        if (aCount !== bCount) return bCount - aCount; // most used first
        return a._tool.name.localeCompare(b._tool.name);
      }
      if (mode === 'custom') {
        const aIdx = toolOrder.indexOf(a._tool.id);
        const bIdx = toolOrder.indexOf(b._tool.id);
        // Tools in custom order come first, in order; rest alphabetical
        if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
        if (aIdx >= 0) return -1;
        if (bIdx >= 0) return 1;
        return a._tool.name.localeCompare(b._tool.name);
      }
      // Default: alphabetical
      return a._tool.name.localeCompare(b._tool.name);
    });

    for (const card of cards) grid.appendChild(card);
    grid.appendChild(emptyMsg);
  }

  // --- Render tool cards ---
  const cards = [];
  for (const tool of toolsRegistry) {
    const isActive = tool.status === 'active' && tool.path;
    const tag = isActive ? 'a' : 'div';
    const card = document.createElement(tag);
    card.className = `tool-card ${!isActive ? 'tool-card--coming-soon' : ''}`;
    if (isActive) card.href = tool.path;
    card._tool = tool; // attach metadata for filtering

    const labels = [];
    for (const bp of tool.bodyParts || []) {
      labels.push(`<span class="tool-card__label tool-card__label--body" data-filter-type="body" data-filter-value="${bp}">${bp}</span>`);
    }
    for (const mod of tool.modalities || []) {
      labels.push(`<span class="tool-card__label tool-card__label--modality" data-filter-type="modality" data-filter-value="${mod}">${getModalityLabel(mod)}</span>`);
    }
    for (const sp of tool.specialties || []) {
      labels.push(`<span class="tool-card__label tool-card__label--specialty" data-filter-type="specialty" data-filter-value="${sp}">${sp}</span>`);
    }

    const isFav = favorites.includes(tool.id);
    const displayName = getToolDisplayName(tool.id, tool.name);
    const isCustomName = displayName !== tool.name;
    const actionsHtml = isActive ? `
      <div class="tool-card__actions">
        <button class="tool-card__rename" data-tool-id="${tool.id}" title="Rename tool"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
        <button class="tool-card__fav ${isFav ? 'tool-card__fav--active' : ''}" data-tool-id="${tool.id}" title="Favorite">${isFav ? '\u2605' : '\u2606'}</button>
        <button class="tool-card__hide" data-tool-id="${tool.id}" title="Hide tool"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button>
      </div>
    ` : (!isActive ? '<span class="tool-card__badge">Coming Soon</span>' : '');

    card.innerHTML = `
      <div class="tool-card__icon">${tool.icon}</div>
      <div class="tool-card__body">
        <h2 class="tool-card__title ${isCustomName ? 'tool-card__title--custom' : ''}">${displayName}</h2>
        <p class="tool-card__desc">${tool.description}</p>
        <div class="tool-card__tags">${labels.join('')}</div>
      </div>
      ${actionsHtml}
    `;

    // Wire star button
    const favBtn = card.querySelector('.tool-card__fav');
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(tool.id);
        const nowFav = favorites.includes(tool.id);
        favBtn.textContent = nowFav ? '\u2605' : '\u2606';
        favBtn.classList.toggle('tool-card__fav--active', nowFav);
      });
    }

    // Wire hide/unhide button
    const hideBtn = card.querySelector('.tool-card__hide');
    if (hideBtn) {
      hideBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleHidden(tool.id);
      });
    }

    // Wire rename button
    const renameBtn = card.querySelector('.tool-card__rename');
    if (renameBtn) {
      renameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const titleEl = card.querySelector('.tool-card__title');
        if (titleEl.tagName === 'INPUT') return; // already editing

        const currentName = getToolDisplayName(tool.id, tool.name);
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tool-card__title-input';
        input.value = currentName;
        input.maxLength = 40;
        input.placeholder = tool.name;

        const commit = () => {
          const newName = input.value.trim();
          const isCustom = newName && newName !== tool.name;
          setToolDisplayName(tool.id, isCustom ? newName : '');
          const h2 = document.createElement('h2');
          h2.className = `tool-card__title ${isCustom ? 'tool-card__title--custom' : ''}`;
          h2.textContent = isCustom ? newName : tool.name;
          input.replaceWith(h2);
        };

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
          if (ev.key === 'Escape') { input.value = tool.name; input.blur(); }
        });

        titleEl.replaceWith(input);
        input.focus();
        input.select();
      });
    }

    // Wire tag clicks to set filter
    card.querySelectorAll('.tool-card__label[data-filter-type]').forEach((label) => {
      label.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const type = label.dataset.filterType;
        const value = label.dataset.filterValue;
        if (type === 'body') bodySelect.value = value;
        else if (type === 'modality') modalitySelect.value = value;
        else if (type === 'specialty') specialtySelect.value = value;
        applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Track usage on click
    if (isActive) {
      card.addEventListener('click', () => trackToolUse(tool.id));
    }

    // Drag-and-drop for custom ordering
    if (isActive) {
      card.draggable = true;
      card.addEventListener('dragstart', (e) => {
        ensureCustomSort();
        e.dataTransfer.setData('text/plain', tool.id);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('tool-card--dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('tool-card--dragging');
        for (const c of cards) c.classList.remove('tool-card--dragover');
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('tool-card--dragover');
      });
      card.addEventListener('dragleave', () => {
        card.classList.remove('tool-card--dragover');
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('tool-card--dragover');
        reorderTool(e.dataTransfer.getData('text/plain'), tool.id);
      });
    }

    grid.appendChild(card);
    cards.push(card);
  }

  // --- Shared reorder helpers ---
  function ensureCustomSort() {
    if (sortSelect.value !== 'custom') {
      sortSelect.value = 'custom';
      setStored('toolSort', 'custom');
    }
  }

  function reorderTool(draggedId, targetId) {
    if (draggedId === targetId) return;
    const order = cards.filter((c) => c.style.display !== 'none').map((c) => c._tool.id);
    const fromIdx = order.indexOf(draggedId);
    if (fromIdx >= 0) order.splice(fromIdx, 1);
    const toIdx = order.indexOf(targetId);
    order.splice(toIdx, 0, draggedId);
    toolOrder = order;
    setStored('toolOrder', toolOrder);
    sortCards();
    applyFilters();
  }

  // --- Touch drag-and-drop (mobile) ---
  let _touchDrag = null;

  grid.addEventListener('touchstart', (e) => {
    const card = e.target.closest('.tool-card');
    if (!card || !card._tool || card.tagName !== 'A') return;

    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    // Long-press to initiate drag (400ms)
    const timer = setTimeout(() => {
      e.preventDefault();
      ensureCustomSort();

      const rect = card.getBoundingClientRect();
      const clone = card.cloneNode(true);
      clone.className = 'tool-card tool-card--touch-clone';
      clone.style.width = rect.width + 'px';
      clone.style.left = rect.left + 'px';
      clone.style.top = rect.top + 'px';
      document.body.appendChild(clone);

      card.classList.add('tool-card--dragging');
      _touchDrag = { card, clone, toolId: card._tool.id, offsetX: startX - rect.left, offsetY: startY - rect.top };
    }, 400);

    const cancelOnMove = (ev) => {
      const t = ev.touches[0];
      // If moved more than 10px before long-press, cancel (user is scrolling)
      if (Math.abs(t.clientX - startX) > 10 || Math.abs(t.clientY - startY) > 10) {
        clearTimeout(timer);
        card.removeEventListener('touchmove', cancelOnMove);
      }
    };
    card.addEventListener('touchmove', cancelOnMove, { passive: true });

    const cleanup = () => {
      clearTimeout(timer);
      card.removeEventListener('touchmove', cancelOnMove);
      card.removeEventListener('touchend', cleanup);
      card.removeEventListener('touchcancel', cleanup);
    };
    card.addEventListener('touchend', cleanup, { once: true });
    card.addEventListener('touchcancel', cleanup, { once: true });
  }, { passive: true });

  grid.addEventListener('touchmove', (e) => {
    if (!_touchDrag) return;
    e.preventDefault();

    const touch = e.touches[0];
    _touchDrag.clone.style.left = (touch.clientX - _touchDrag.offsetX) + 'px';
    _touchDrag.clone.style.top = (touch.clientY - _touchDrag.offsetY) + 'px';

    // Find card under touch
    _touchDrag.clone.style.display = 'none';
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    _touchDrag.clone.style.display = '';

    for (const c of cards) c.classList.remove('tool-card--dragover');
    const target = el?.closest('.tool-card');
    if (target && target !== _touchDrag.card && target._tool) {
      target.classList.add('tool-card--dragover');
      _touchDrag.targetId = target._tool.id;
    } else {
      _touchDrag.targetId = null;
    }
  }, { passive: false });

  grid.addEventListener('touchend', () => {
    if (!_touchDrag) return;

    _touchDrag.card.classList.remove('tool-card--dragging');
    _touchDrag.clone.remove();
    for (const c of cards) c.classList.remove('tool-card--dragover');

    if (_touchDrag.targetId) {
      reorderTool(_touchDrag.toolId, _touchDrag.targetId);
    }
    _touchDrag = null;
  });

  // Empty-state message (hidden by default)
  const emptyMsg = document.createElement('div');
  emptyMsg.className = 'tools-grid__empty';
  emptyMsg.textContent = 'No tools match your filters.';
  emptyMsg.style.display = 'none';
  grid.appendChild(emptyMsg);

  // --- Filter logic ---
  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const modFilter = modalitySelect.value;
    const bodyFilter = bodySelect.value;
    const specFilter = specialtySelect.value;
    const favsOnly = favsToggle.classList.contains('filter-bar__favs-toggle--active');
    const hasAnyFilter = query.length > 0 || modFilter || bodyFilter || specFilter || favsOnly || sortSelect.value !== 'alpha';

    clearBtn.classList.toggle('visible', hasAnyFilter);

    let visibleCount = 0;
    for (const card of cards) {
      const tool = card._tool;
      let visible = true;

      // Hidden tools — hide unless "Show hidden" is active
      const showingHidden = hiddenToggle.classList.contains('filter-bar__favs-toggle--active');
      if (hiddenTools.includes(tool.id) && !showingHidden) {
        visible = false;
      }

      // Favorites-only mode
      if (visible && favsOnly) {
        visible = favorites.includes(tool.id);
      }

      // Text search — match name, custom name, or description
      if (visible && query) {
        const customName = getToolDisplayName(tool.id, '');
        const haystack = (tool.name + ' ' + (customName || '') + ' ' + tool.description).toLowerCase();
        visible = haystack.includes(query);
      }

      // Modality dropdown
      if (visible && modFilter) {
        visible = (tool.modalities || []).includes(modFilter);
      }

      // Body part dropdown
      if (visible && bodyFilter) {
        visible = (tool.bodyParts || []).includes(bodyFilter);
      }

      // Specialty dropdown
      if (visible && specFilter) {
        visible = (tool.specialties || []).includes(specFilter);
      }

      card.style.display = visible ? '' : 'none';
      if (visible) visibleCount++;

      // Mark hidden-but-revealed cards with distinct styling + eye-open icon
      const isHiddenRevealed = hiddenTools.includes(tool.id) && showingHidden && visible;
      card.classList.toggle('tool-card--hidden-revealed', isHiddenRevealed);
      const hideBtn = card.querySelector('.tool-card__hide');
      if (hideBtn) {
        if (isHiddenRevealed) {
          hideBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
          hideBtn.title = 'Unhide tool';
        } else {
          hideBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
          hideBtn.title = 'Hide tool';
        }
      }
    }

    emptyMsg.style.display = visibleCount === 0 ? '' : 'none';
  }

  searchInput.addEventListener('input', applyFilters);

  // Initial sort by favorites
  sortCards();
  updateHiddenToggle();
  applyFilters();
}

// Handle shared template URLs: ?share=XXXXXXXX
const params = new URLSearchParams(window.location.search);
const shareCode = params.get('share');
if (shareCode) {
  (async () => {
    const shared = await loadSharedTemplate(shareCode);
    if (!shared) {
      alert('Shared template not found or has been removed.');
      return;
    }

    const tool = toolsRegistry.find((t) => t.id === shared.toolId);
    const toolName = tool?.name || shared.toolId;

    // Show import dialog
    const overlay = document.createElement('div');
    overlay.className = 'auth-modal-overlay';
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div class="auth-modal" style="max-width:450px">
        <div class="auth-modal__brand">
          <div class="auth-modal__logo">R</div>
          <div class="auth-modal__brand-name">Shared Template</div>
        </div>
        <div class="auth-modal__body">
          <p style="font-size:var(--text-sm);color:var(--text-secondary);text-align:center;">
            Someone shared a <strong>${toolName}</strong> report template (${shared.templateId}) with you.
          </p>
          <div style="display:flex;gap:var(--space-sm);justify-content:center;">
            <button class="btn btn--primary" id="import-template">Import to My Account</button>
            <button class="btn" id="dismiss-share">Dismiss</button>
          </div>
          <p id="import-status" style="font-size:var(--text-xs);color:var(--text-muted);text-align:center;"></p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#dismiss-share').addEventListener('click', () => {
      overlay.remove();
      history.replaceState(null, '', '/');
    });

    overlay.querySelector('#import-template').addEventListener('click', async () => {
      if (!isLoggedIn()) {
        overlay.querySelector('#import-status').textContent = 'Please sign in first to import templates.';
        return;
      }
      // Save to user's localStorage (will sync to Firestore via storage.js)
      const key = `radtools:blockConfig:${shared.toolId}:${shared.templateId}`;
      localStorage.setItem(key, JSON.stringify(shared.config));
      overlay.querySelector('#import-status').textContent = 'Template imported! Go to ' + toolName + ' to use it.';
      overlay.querySelector('#import-template').disabled = true;
    });
  })();
}
