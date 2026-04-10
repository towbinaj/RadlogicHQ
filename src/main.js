import './styles/base.css';
import './styles/forms.css';
import './components/auth-ui.js';
import { toolsRegistry, getModalityLabel, getActiveLabels, MODALITIES } from './data/tools-registry.js';
import { loadSharedTemplate } from './core/user-data.js';
import { isLoggedIn } from './core/auth.js';
import { copyToClipboard } from './core/clipboard.js';
import { getStored, setStored } from './core/storage.js';

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

  /* Icon color coding by tool category */
  .tool-card__icon--rads { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
  .tool-card__icon--oncologic { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
  .tool-card__icon--trauma { background: rgba(248, 113, 113, 0.15); color: #f87171; }
  .tool-card__icon--body { background: rgba(52, 211, 153, 0.15); color: #34d399; }
  .tool-card__icon--cardiac { background: rgba(251, 146, 60, 0.15); color: #fb923c; }
  .tool-card__icon--msk { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
  .tool-card__icon--peds { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
  .tool-card__icon--neuro { background: rgba(244, 114, 182, 0.15); color: #f472b6; }
  .tool-card__icon--fetal { background: rgba(192, 132, 252, 0.15); color: #c084fc; }

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
  }

  .tool-card__label--body { color: var(--info); border-color: rgba(96, 165, 250, 0.3); }
  .tool-card__label--modality { color: var(--success); border-color: rgba(52, 211, 153, 0.3); }
  .tool-card__label--specialty { color: var(--warning); border-color: rgba(251, 191, 36, 0.3); }

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

  // --- Favorites & hidden state ---
  let favorites = getStored('favorites', []);
  let hiddenTools = getStored('hiddenTools', []);

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
    // Sort: favorites first (in favorites array order), then registry order
    cards.sort((a, b) => {
      const aFav = favorites.includes(a._tool.id);
      const bFav = favorites.includes(b._tool.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      if (aFav && bFav) return favorites.indexOf(a._tool.id) - favorites.indexOf(b._tool.id);
      return 0; // preserve registry order for non-favorites
    });
    for (const card of cards) grid.appendChild(card);
    grid.appendChild(emptyMsg);
  }

  // --- Icon category map ---
  const ICON_CATEGORY = {
    tirads: 'rads', lirads: 'rads', pirads: 'rads', orads: 'rads', lungrads: 'rads', birads: 'rads', cadrads: 'rads', nirads: 'rads',
    recist: 'oncologic', mrecist: 'oncologic', rapno: 'oncologic', deauville: 'oncologic', lugano: 'oncologic', curie: 'oncologic', idrf: 'oncologic', pretext: 'oncologic',
    'aast-liver': 'trauma', 'aast-spleen': 'trauma', 'aast-kidney': 'trauma', 'aast-pancreas': 'trauma', aspects: 'trauma', 'sah-grade': 'trauma',
    'adrenal-washout': 'body', bosniak: 'body', fleischner: 'body', balthazar: 'body', nascet: 'neuro',
    agatston: 'cardiac',
    scoliosis: 'msk', kyphosis: 'msk', reimers: 'msk', leglength: 'msk', 'salter-harris': 'msk', 'kellgren-lawrence': 'msk', 'hip-dysplasia': 'msk', 'bone-age-gp': 'msk', 'bone-age-sontag': 'msk', pectus: 'msk',
    hydronephrosis: 'peds', 'vur-vcug': 'peds', 'vur-nm': 'peds', gmh: 'peds',
    'fetal-biometry': 'fetal', 'fetal-ventricle': 'fetal', 'fetal-lung': 'fetal', 'fetal-cc': 'fetal', 'fetal-pf': 'fetal',
  };

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
      labels.push(`<span class="tool-card__label tool-card__label--body">${bp}</span>`);
    }
    for (const mod of tool.modalities || []) {
      labels.push(`<span class="tool-card__label tool-card__label--modality">${getModalityLabel(mod)}</span>`);
    }
    for (const sp of tool.specialties || []) {
      labels.push(`<span class="tool-card__label tool-card__label--specialty">${sp}</span>`);
    }

    const isFav = favorites.includes(tool.id);
    const actionsHtml = isActive ? `
      <div class="tool-card__actions">
        <button class="tool-card__fav ${isFav ? 'tool-card__fav--active' : ''}" data-tool-id="${tool.id}" title="Favorite">${isFav ? '\u2605' : '\u2606'}</button>
        <button class="tool-card__hide" data-tool-id="${tool.id}" title="Hide tool"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button>
      </div>
    ` : (!isActive ? '<span class="tool-card__badge">Coming Soon</span>' : '');

    card.innerHTML = `
      <div class="tool-card__icon ${ICON_CATEGORY[tool.id] ? 'tool-card__icon--' + ICON_CATEGORY[tool.id] : ''}">${tool.icon}</div>
      <div class="tool-card__body">
        <h2 class="tool-card__title">${tool.name}</h2>
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

    grid.appendChild(card);
    cards.push(card);
  }

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
    const hasAnyFilter = query.length > 0 || modFilter || bodyFilter || specFilter || favsOnly;

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

      // Text search — match name or description
      if (visible && query) {
        const haystack = (tool.name + ' ' + tool.description).toLowerCase();
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
