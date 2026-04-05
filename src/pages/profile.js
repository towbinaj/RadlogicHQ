import '../styles/base.css';
import '../styles/forms.css';
import './profile.css';
import '../components/auth-ui.js';
import { onAuthChange, getUser, signOut } from '../core/auth.js';
import { getSavedReports } from '../core/user-data.js';

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
            <span class="profile-pref__label">Compact mode (TI-RADS)</span>
            <label class="profile-pref__toggle">
              <input type="checkbox" id="pref-compact" ${localStorage.getItem('radtools:compact') === '1' ? 'checked' : ''}>
              <span>${localStorage.getItem('radtools:compact') === '1' ? 'On' : 'Off'}</span>
            </label>
          </div>
          <div class="profile-pref">
            <span class="profile-pref__label">TI-RADS size unit</span>
            <select id="pref-tirads-unit" class="profile-pref__select">
              <option value="cm" ${(localStorage.getItem('radtools:sizeUnit:nodule-size') || 'cm') === 'cm' ? 'selected' : ''}>cm</option>
              <option value="mm" ${localStorage.getItem('radtools:sizeUnit:nodule-size') === 'mm' ? 'selected' : ''}>mm</option>
            </select>
          </div>
          <div class="profile-pref">
            <span class="profile-pref__label">LI-RADS size unit</span>
            <select id="pref-lirads-unit" class="profile-pref__select">
              <option value="mm" ${(localStorage.getItem('radtools:sizeUnit:lirads') || 'mm') === 'mm' ? 'selected' : ''}>mm</option>
              <option value="cm" ${localStorage.getItem('radtools:sizeUnit:lirads') === 'cm' ? 'selected' : ''}>cm</option>
            </select>
          </div>
        </div>
      </div>
    `;

    page.querySelector('#profile-signout').addEventListener('click', () => signOut());

    // Wire preference controls
    const compactToggle = page.querySelector('#pref-compact');
    compactToggle.addEventListener('change', () => {
      localStorage.setItem('radtools:compact', compactToggle.checked ? '1' : '0');
      compactToggle.nextElementSibling.textContent = compactToggle.checked ? 'On' : 'Off';
    });

    page.querySelector('#pref-tirads-unit').addEventListener('change', (e) => {
      localStorage.setItem('radtools:sizeUnit:nodule-size', e.target.value);
    });

    page.querySelector('#pref-lirads-unit').addEventListener('change', (e) => {
      localStorage.setItem('radtools:sizeUnit:lirads', e.target.value);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
