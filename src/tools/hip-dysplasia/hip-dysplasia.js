import '../../styles/base.css';
import '../../styles/forms.css';
import './hip-dysplasia.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { hipDysplasiaDefinition } from './definition.js';
import { calculateHipDysplasia } from './calculator.js';
import { hipDysplasiaTemplates } from './templates.js';
import { getStored, setStored } from '../../core/storage.js';

let mode = getStored('mode:hip-dysplasia', 'graf');

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeType = document.getElementById('badge-type');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const modeTabsEl = document.getElementById('mode-tabs');

  reportEl.toolId = hipDysplasiaDefinition.id;
  reportEl.definition = hipDysplasiaDefinition;
  reportEl.setTemplates(hipDysplasiaTemplates);

  const formState = { grade: null, side: null, alpha: null, beta: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function renderModeTabs() {
    modeTabsEl.innerHTML = '';
    [{ id: 'graf', label: 'Graf' }, { id: 'aaos', label: 'AAOS' }].forEach((m) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${mode === m.id ? 'active' : ''}`;
      tab.textContent = m.label;
      tab.addEventListener('click', () => { mode = m.id; setStored('mode:hip-dysplasia', mode); formState.grade = null; renderModeTabs(); buildUI(); });
      modeTabsEl.appendChild(tab);
    });
  }

  function buildUI() {
    stepContainer.innerHTML = '';

    // Side
    const sideCard = document.createElement('div');
    sideCard.className = 'card';
    const angleHtml = mode === 'graf' ? `
      <div class="input-group" style="max-width:100px;"><label for="alpha-angle">Alpha \u00b0</label><input type="number" id="alpha-angle" class="no-spinner" min="0" max="90" step="0.1" value="${formState.alpha ?? ''}" placeholder="\u00b0"></div>
      <div class="input-group" style="max-width:100px;"><label for="beta-angle">Beta \u00b0</label><input type="number" id="beta-angle" class="no-spinner" min="0" max="90" step="0.1" value="${formState.beta ?? ''}" placeholder="\u00b0"></div>
    ` : '';
    sideCard.innerHTML = `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap; align-items:end;">
        <div class="input-group"><label>Side</label><div class="toggle-group">${hipDysplasiaDefinition.sideOptions.map((o) => `<button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>
        ${angleHtml}
      </div>
    `;
    sideCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => { formState.side = btn.dataset.value; sideCard.querySelectorAll('.toggle-group__btn').forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn)); update(); });
    });
    if (mode === 'graf') {
      sideCard.querySelector('#alpha-angle')?.addEventListener('input', (e) => { formState.alpha = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
      sideCard.querySelector('#beta-angle')?.addEventListener('input', (e) => { formState.beta = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    }
    stepContainer.appendChild(sideCard);

    // Classification
    const grades = mode === 'graf' ? hipDysplasiaDefinition.grafTypes : hipDysplasiaDefinition.aaosCategories;
    const gradeCard = document.createElement('div');
    gradeCard.className = 'step-card card';
    gradeCard.innerHTML = `<div class="step-card__question">${mode === 'graf' ? 'Graf Type' : 'AAOS Classification'}</div><div style="display:flex; flex-direction:column; gap:var(--space-xs);">${grades.map((g) => `<button class="benign-choice ${formState.grade === g.id ? 'benign-choice--active' : ''}" data-grade="${g.id}" style="text-align:left; justify-content:flex-start;">${g.label}<br><span style="font-size:var(--text-xs); color:var(--text-muted);">${g.description}</span></button>`).join('')}</div>`;
    gradeCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => { formState.grade = btn.dataset.grade; gradeCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.grade === formState.grade)); update(); });
    });
    stepContainer.appendChild(gradeCard);
    update();
  }

  function update() { const r = calculateHipDysplasia(formState, mode); badgeType.textContent = r.grade; badgeType.dataset.level = r.level; updateReport(); }

  function updateReport() {
    const data = calculateHipDysplasia(formState, mode);
    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) { let text = renderEditorContent(config.editorContent, config.pillStates, data); if (studyAdditionalFindings.trim()) text += '\n\n' + (config.sectionHeaders?.additionalFindings ?? 'Other findings:') + '\n' + studyAdditionalFindings.trim(); return text; }
      const blocks = config.blocks || []; const headers = config.sectionHeaders || {}; const sections = [];
      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + renderBlocks(blocks, data, false));
      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      sections.push((headers.additionalFindings ?? 'Other findings:') + '\n' + (studyAdditionalFindings.trim() || 'None.'));
      if (config.impression?.enabled && config.impression?.template) sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, data));
      return sections.join('\n\n');
    };
    reportEl.updateReport(data);
  }

  document.getElementById('parse-btn').addEventListener('click', () => { const s = document.getElementById('parse-status'); s.textContent = 'Parse not yet implemented'; s.className = 'parse-panel__status'; setTimeout(() => { s.textContent = ''; }, 3000); });
  renderModeTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
