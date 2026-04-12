import '../styles/base.css';
import '../styles/forms.css';
import './profile.css';
import '../components/auth-ui.js';
import { onAuthChange, getUser, signOut, deleteAccount } from '../core/auth.js';
import { getSavedReports, getPreferences, exportAllUserData, deleteAllUserData } from '../core/user-data.js';
import { getStored, setStored } from '../core/storage.js';
import { toolsRegistry } from '../data/tools-registry.js';

function init() {
  const page = document.getElementById('profile-page');
  const loginPrompt = document.getElementById('login-prompt');

  onAuthChange(async (user) => {
    if (!user) {
      page.style.display = 'none';
      loginPrompt.style.display = '';
      return;
    }

    loginPrompt.style.display = 'none';
    page.style.display = '';

    // Count saved reports per tool
    let tiradsReports = [];
    let liradsReports = [];
    try {
      tiradsReports = await getSavedReports('tirads');
      liradsReports = await getSavedReports('lirads');
    } catch { /* silent */ }

    const totalReports = tiradsReports.length + liradsReports.length;

    // Count custom templates in localStorage
    let templateCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith('radtools:blockConfig:')) templateCount++;
    }

    page.innerHTML = `
      <div class="profile-card card">
        <div class="profile-card__header">
          <div class="profile-card__avatar">${(user.displayName || user.email || '?')[0].toUpperCase()}</div>
          <div class="profile-card__info">
            <h2 class="profile-card__name">${user.displayName || 'User'}</h2>
            <p class="profile-card__email">${user.email}</p>
          </div>
        </div>
        <button class="btn profile-card__signout" id="profile-signout">Sign Out</button>
      </div>

      <div class="profile-section card">
        <h3>Your Data</h3>
        <div class="profile-stats">
          <div class="profile-stat">
            <span class="profile-stat__value">${totalReports}</span>
            <span class="profile-stat__label">Saved Reports</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat__value">${templateCount}</span>
            <span class="profile-stat__label">Custom Templates</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat__value">${tiradsReports.length}</span>
            <span class="profile-stat__label">TI-RADS Reports</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat__value">${liradsReports.length}</span>
            <span class="profile-stat__label">LI-RADS Reports</span>
          </div>
        </div>
      </div>

      <div class="profile-section card">
        <h3>Preferences</h3>
        <div class="profile-prefs">
          <div class="profile-pref">
            <span class="profile-pref__label">Default report template</span>
            <select id="pref-template" class="profile-pref__select">
              <option value="ps360" ${(getStored('defaultTemplate') || 'ps360') === 'ps360' ? 'selected' : ''}>PowerScribe 360</option>
              <option value="ps1" ${getStored('defaultTemplate') === 'ps1' ? 'selected' : ''}>PowerScribe One</option>
              <option value="radai" ${getStored('defaultTemplate') === 'radai' ? 'selected' : ''}>RadAI Omni</option>
            </select>
          </div>
          <div class="profile-pref">
            <span class="profile-pref__label">Default measurement unit</span>
            <select id="pref-unit" class="profile-pref__select">
              <option value="mm" ${(getStored('defaultUnit') || 'mm') === 'mm' ? 'selected' : ''}>mm</option>
              <option value="cm" ${getStored('defaultUnit') === 'cm' ? 'selected' : ''}>cm</option>
            </select>
          </div>
          <div class="profile-pref">
            <span class="profile-pref__label">Compact mode</span>
            <label class="profile-pref__toggle">
              <input type="checkbox" id="pref-compact" ${getStored('compact') === 1 || getStored('compact') === '1' ? 'checked' : ''}>
              <span>${getStored('compact') === 1 || getStored('compact') === '1' ? 'On' : 'Off'}</span>
            </label>
          </div>
          <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:-8px;">Hides reference images in tools to save screen space</p>
          <div class="profile-pref">
            <span class="profile-pref__label">MIBG scoring system</span>
            <select id="pref-curie-mode" class="profile-pref__select">
              <option value="curie" ${(getStored('mode:curie') || 'curie') === 'curie' ? 'selected' : ''}>Curie</option>
              <option value="siopen" ${getStored('mode:curie') === 'siopen' ? 'selected' : ''}>SIOPEN</option>
            </select>
          </div>
          <div class="profile-pref">
            <span class="profile-pref__label">Leg length mode</span>
            <select id="pref-leglength-mode" class="profile-pref__select">
              <option value="total" ${(getStored('mode:leglength') || 'total') === 'total' ? 'selected' : ''}>Total</option>
              <option value="segmental" ${getStored('mode:leglength') === 'segmental' ? 'selected' : ''}>Segmental</option>
            </select>
          </div>
        </div>
      </div>

      <div class="profile-section card" id="renamed-tools-section" style="${Object.keys(getStored('toolNames', {})).length === 0 ? 'display:none' : ''}">
        <h3>Renamed Tools</h3>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-sm);">Custom tool names. Click to reset to default.</p>
        <div id="renamed-tools-list" style="display:flex;flex-wrap:wrap;gap:var(--space-xs);"></div>
      </div>

      <div class="profile-section card" id="hidden-tools-section" style="${(getStored('hiddenTools', [])).length === 0 ? 'display:none' : ''}">
        <h3>Hidden Tools</h3>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-sm);">These tools are hidden from your landing page. Click to unhide.</p>
        <div id="hidden-tools-list" style="display:flex;flex-wrap:wrap;gap:var(--space-xs);"></div>
      </div>

      <div class="profile-section card">
        <h3>Data Management</h3>
        <div class="profile-data-actions">
          <button class="btn" id="export-data">Export All</button>
          <button class="btn" id="export-templates">Export Templates</button>
          <button class="btn" id="import-data">Import</button>
          <input type="file" id="import-file" accept=".json" style="display:none">
          <button class="btn" id="delete-account" style="color:var(--danger);border-color:var(--danger)">Delete Account</button>
        </div>
        <p class="profile-data-hint">Export All downloads everything as JSON. Export Templates exports only your custom report templates. Import restores data from a previous export.</p>
      </div>

      <div class="profile-section" style="text-align:center;padding:var(--space-md)">
        <a href="/src/pages/privacy.html" style="font-size:var(--text-xs);color:var(--text-muted)">Privacy Policy</a>
      </div>
    `;

    page.querySelector('#profile-signout').addEventListener('click', () => signOut());

    // Wire preference controls
    page.querySelector('#pref-template').addEventListener('change', (e) => {
      setStored('defaultTemplate', e.target.value);
    });

    page.querySelector('#pref-unit').addEventListener('change', (e) => {
      setStored('defaultUnit', e.target.value);
    });

    const compactToggle = page.querySelector('#pref-compact');
    compactToggle.addEventListener('change', () => {
      setStored('compact', compactToggle.checked ? '1' : '0');
      compactToggle.nextElementSibling.textContent = compactToggle.checked ? 'On' : 'Off';
    });

    page.querySelector('#pref-curie-mode').addEventListener('change', (e) => {
      setStored('mode:curie', e.target.value);
    });

    page.querySelector('#pref-leglength-mode').addEventListener('change', (e) => {
      setStored('mode:leglength', e.target.value);
    });

    // Hidden tools recovery
    function renderHiddenTools() {
      const hidden = getStored('hiddenTools', []);
      const section = page.querySelector('#hidden-tools-section');
      const list = page.querySelector('#hidden-tools-list');
      section.style.display = hidden.length === 0 ? 'none' : '';
      list.innerHTML = '';
      for (const toolId of hidden) {
        const tool = toolsRegistry.find((t) => t.id === toolId);
        if (!tool) continue;
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.fontSize = 'var(--text-xs)';
        btn.textContent = `${tool.name} \u00d7`;
        btn.title = `Unhide ${tool.name}`;
        btn.addEventListener('click', () => {
          const updated = getStored('hiddenTools', []).filter((id) => id !== toolId);
          setStored('hiddenTools', updated);
          renderHiddenTools();
        });
        list.appendChild(btn);
      }
    }
    renderHiddenTools();

    // Renamed tools management
    function renderRenamedTools() {
      const customNames = getStored('toolNames', {});
      const entries = Object.entries(customNames);
      const section = page.querySelector('#renamed-tools-section');
      const list = page.querySelector('#renamed-tools-list');
      section.style.display = entries.length === 0 ? 'none' : '';
      list.innerHTML = '';
      for (const [toolId, customName] of entries) {
        const tool = toolsRegistry.find((t) => t.id === toolId);
        if (!tool) continue;
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.fontSize = 'var(--text-xs)';
        btn.textContent = `${tool.name} \u2192 ${customName} \u00d7`;
        btn.title = `Reset "${customName}" back to "${tool.name}"`;
        btn.addEventListener('click', () => {
          const names = getStored('toolNames', {});
          delete names[toolId];
          setStored('toolNames', names);
          renderRenamedTools();
        });
        list.appendChild(btn);
      }
    }
    renderRenamedTools();

    // Export data
    page.querySelector('#export-data').addEventListener('click', async () => {
      try {
        const data = await exportAllUserData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `radiologichq-data-${user.email.split('@')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('Export failed: ' + err.message);
      }
    });

    // Export templates only
    page.querySelector('#export-templates').addEventListener('click', () => {
      // Gather all custom templates
      const allTemplates = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith('radtools:blockConfig:')) continue;
        const parts = key.replace('radtools:blockConfig:', '').split(':');
        if (parts.length !== 2) continue;
        try {
          allTemplates.push({
            toolId: parts[0],
            templateId: parts[1],
            config: JSON.parse(localStorage.getItem(key)),
          });
        } catch { /* skip malformed */ }
      }
      if (allTemplates.length === 0) {
        alert('No custom templates found.');
        return;
      }

      // Show selection dialog
      const overlay = document.createElement('div');
      overlay.className = 'auth-modal-overlay';
      overlay.style.display = 'flex';
      const toolNames = {};
      for (const t of toolsRegistry) toolNames[t.id] = t.name;
      overlay.innerHTML = `
        <div class="auth-modal" style="max-width:450px">
          <div class="auth-modal__brand"><div class="auth-modal__brand-name">Export Templates</div></div>
          <div class="auth-modal__body">
            <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-sm);">Select custom templates to export:</p>
            <div style="display:flex;flex-direction:column;gap:var(--space-xs);max-height:300px;overflow-y:auto;">
              ${allTemplates.map((t, i) => `
                <label style="display:flex;align-items:center;gap:var(--space-xs);font-size:var(--text-sm);cursor:pointer;">
                  <input type="checkbox" checked data-idx="${i}" style="width:16px;height:16px;accent-color:var(--accent);">
                  ${toolNames[t.toolId] || t.toolId} (${t.templateId})
                </label>
              `).join('')}
            </div>
            <div style="display:flex;gap:var(--space-sm);justify-content:center;margin-top:var(--space-md);">
              <button class="btn btn--primary" id="do-export-templates">Export Selected</button>
              <button class="btn" id="cancel-export-templates">Cancel</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('#cancel-export-templates').addEventListener('click', () => overlay.remove());
      overlay.querySelector('#do-export-templates').addEventListener('click', () => {
        const selected = [...overlay.querySelectorAll('input[type="checkbox"]:checked')]
          .map((cb) => allTemplates[parseInt(cb.dataset.idx)]);
        if (selected.length === 0) { alert('No templates selected.'); return; }
        const data = {
          type: 'radiologichq-templates',
          templates: selected,
          exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `radiologichq-templates-${user.email.split('@')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        overlay.remove();
      });
    });

    // Import data
    const importBtn = page.querySelector('#import-data');
    const importFile = page.querySelector('#import-file');
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async () => {
      const file = importFile.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Single-tool template export
        if (data.type === 'radiologichq-template' && data.config && data.toolId) {
          const confirmed = confirm(`Import ${data.toolId} template (${data.templateId || 'default'})?`);
          if (!confirmed) return;
          setStored(`blockConfig:${data.toolId}:${data.templateId || 'ps360'}`, data.config);
          alert('Template imported!');
          window.location.reload();
          return;
        }

        // Multi-template or full data export
        if (!data.preferences && !data.templates) {
          alert('Invalid export file — no preferences or templates found.');
          return;
        }

        const dateStr = data.exportedAt ? new Date(data.exportedAt).toLocaleDateString() : 'unknown date';
        const isTemplatesOnly = data.type === 'radiologichq-templates';
        const desc = isTemplatesOnly
          ? `Import ${data.templates.length} template(s) from ${dateStr}?`
          : `Import data from ${dateStr}?\n\nThis will merge preferences and templates into your current account.`;
        if (!confirm(desc)) return;

        let prefCount = 0;
        // Import preferences (full export only)
        if (data.preferences && typeof data.preferences === 'object') {
          for (const [key, value] of Object.entries(data.preferences)) {
            setStored(key, value);
            prefCount++;
          }
        }

        // Import templates
        let tmplCount = 0;
        if (Array.isArray(data.templates)) {
          for (const tmpl of data.templates) {
            if (tmpl.toolId && tmpl.templateId && tmpl.config) {
              setStored(`blockConfig:${tmpl.toolId}:${tmpl.templateId}`, tmpl.config);
              tmplCount++;
            }
          }
        }

        alert(`Import complete!\n\nPreferences: ${prefCount} keys\nTemplates: ${tmplCount}\n\nReload to see changes.`);
        window.location.reload();
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
      importFile.value = '';
    });

    // Delete account
    page.querySelector('#delete-account').addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to permanently delete your account and all data? This cannot be undone.');
      if (!confirmed) return;
      const doubleConfirm = confirm('This will permanently delete your profile, preferences, templates, and saved reports. Continue?');
      if (!doubleConfirm) return;

      try {
        await deleteAllUserData();
        await deleteAccount();
        window.location.href = '/';
      } catch (err) {
        alert('Deletion failed: ' + err.message + '. You may need to sign in again recently.');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
