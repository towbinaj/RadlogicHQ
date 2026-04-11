import '../../styles/base.css';
import '../../styles/forms.css';
import './hydronephrosis.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { hydronephrosisDefinition } from './definition.js';
import { calculateHydronephrosis } from './calculator.js';
import { parseFindings } from '../../core/parser.js';
import { hydronephrosisTemplates } from './templates.js';
import { getStored, setStored , trackEvent } from '../../core/storage.js';

let mode = getStored('mode:hydronephrosis', 'utd-postnatal');

function init() {
  trackEvent('tool:hydronephrosis:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeGrade = document.getElementById('badge-grade');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const modeTabsEl = document.getElementById('mode-tabs');

  reportEl.toolId = hydronephrosisDefinition.id;
  reportEl.definition = hydronephrosisDefinition;
  reportEl.setTemplates(hydronephrosisTemplates);

  const formState = { grade: null, side: null, aprpd: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  const modes = [
    { id: 'utd-postnatal', label: 'UTD Postnatal' },
    { id: 'utd-antenatal', label: 'UTD Antenatal' },
    { id: 'sfu', label: 'SFU' },
  ];

  function renderModeTabs() {
    modeTabsEl.innerHTML = '';
    modes.forEach((m) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${mode === m.id ? 'active' : ''}`;
      tab.textContent = m.label;
      tab.addEventListener('click', () => {
        mode = m.id;
        setStored('mode:hydronephrosis', mode);
        formState.grade = null;
        renderModeTabs();
        buildUI();
      });
      modeTabsEl.appendChild(tab);
    });
  }

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = hydronephrosisDefinition;

    // Side
    const sideCard = document.createElement('div');
    sideCard.className = 'card';
    sideCard.innerHTML = `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap; align-items:end;">
        <div class="input-group"><label>Side</label>
          <div class="toggle-group">${def.sideOptions.map((o) => `<button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div>
        </div>
        <div class="input-group" style="max-width:140px;"><label for="aprpd-input">APRPD (mm)</label><input type="number" id="aprpd-input" class="no-spinner" min="0" step="0.1" value="${formState.aprpd ?? ''}" placeholder="mm"></div>
      </div>
    `;
    sideCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.side = btn.dataset.value;
        sideCard.querySelectorAll('.toggle-group__btn').forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn));
        update();
      });
    });
    sideCard.querySelector('#aprpd-input').addEventListener('input', (e) => { formState.aprpd = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    stepContainer.appendChild(sideCard);

    // Grade selection
    let grades;
    if (mode === 'utd-postnatal') grades = def.utdPostnatal;
    else if (mode === 'utd-antenatal') grades = def.utdAntenatal;
    else grades = def.sfuGrades;

    const gradeCard = document.createElement('div');
    gradeCard.className = 'step-card card';
    gradeCard.innerHTML = `
      <div class="step-card__question">${modes.find((m) => m.id === mode).label} Grade</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${grades.map((g) => `
          <button class="benign-choice ${formState.grade === g.id ? 'benign-choice--active' : ''}"
            data-grade="${g.id}" style="text-align:left; justify-content:flex-start;">
            ${g.label}<br><span style="font-size:var(--text-xs); color:var(--text-muted);">${g.description}</span>
          </button>
        `).join('')}
      </div>
    `;
    gradeCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.grade = btn.dataset.grade;
        gradeCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.grade === formState.grade));
        update();
      });
    });
    stepContainer.appendChild(gradeCard);

    update();
  }

  function update() {
    const result = calculateHydronephrosis(formState, mode);
    badgeGrade.textContent = result.gradeLabel !== '--' ? result.gradeLabel.replace(/^(UTD |SFU )/, '') : '--';
    badgeGrade.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateHydronephrosis(formState, mode);
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

  const parseBtn = document.getElementById('parse-btn');
  const parseInput = document.getElementById('parse-input');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, hydronephrosisDefinition);
    Object.assign(formState, parsed);
    additionalFindingsEl.value = remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;
    buildUI();
    const total = matched.length + unmatched.length;
    parseStatus.textContent = `Matched ${matched.length}/${total}${remainder ? ' — remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });
  renderModeTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
