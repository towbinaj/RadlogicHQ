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
            <span class="profile-pref__label">Compact mode (TI-RADS)</span>
            <label class="profile-pref__toggle">
              <input type="checkbox" id="pref-compact" ${getStored('compact') === 1 || getStored('compact') === '1' ? 'checked' : ''}>
              <span>${getStored('compact') === 1 || getStored('compact') === '1' ? 'On' : 'Off'}</span>
            </label>
          </div>
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

      <div class="profile-section card" id="hidden-tools-section" style="${(getStored('hiddenTools', [])).length === 0 ? 'display:none' : ''}">
        <h3>Hidden Tools</h3>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-sm);">These tools are hidden from your landing page. Click to unhide.</p>
        <div id="hidden-tools-list" style="display:flex;flex-wrap:wrap;gap:var(--space-xs);"></div>
      </div>

      <div class="profile-section card">
        <h3>Data Management</h3>
        <div class="profile-data-actions">
          <button class="btn" id="export-data">Export My Data</button>
          <button class="btn" id="delete-account" style="color:var(--danger);border-color:var(--danger)">Delete Account</button>
        </div>
        <p class="profile-data-hint">Export downloads all your data as JSON. Delete permanently removes your account and all associated data.</p>
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
