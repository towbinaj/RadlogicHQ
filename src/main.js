import './styles/base.css';
import './styles/forms.css';
import './components/auth-ui.js';
import { toolsRegistry, getModalityLabel } from './data/tools-registry.js';
import { loadSharedTemplate } from './core/user-data.js';
import { isLoggedIn } from './core/auth.js';
import { copyToClipboard } from './core/clipboard.js';

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
`;
document.head.appendChild(style);

// Render tool cards from registry
const grid = document.getElementById('tools-grid');
if (grid) {
  for (const tool of toolsRegistry) {
    const isActive = tool.status === 'active' && tool.path;
    const tag = isActive ? 'a' : 'div';
    const card = document.createElement(tag);
    card.className = `tool-card ${!isActive ? 'tool-card--coming-soon' : ''}`;
    if (isActive) card.href = tool.path;

    // Build label tags
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

    card.innerHTML = `
      <div class="tool-card__icon">${tool.icon}</div>
      <div class="tool-card__body">
        <h2 class="tool-card__title">${tool.name}</h2>
        <p class="tool-card__desc">${tool.description}</p>
        <div class="tool-card__tags">${labels.join('')}</div>
      </div>
      ${!isActive ? '<span class="tool-card__badge">Coming Soon</span>' : ''}
    `;

    grid.appendChild(card);
  }
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
