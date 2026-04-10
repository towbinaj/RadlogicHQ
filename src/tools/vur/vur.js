import '../../styles/base.css';
import '../../styles/forms.css';
import './vur.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { vurDefinition } from './definition.js';
import { calculateVur } from './calculator.js';
import { vurTemplates } from './templates.js';

let mode = 'vcug';

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeGrade = document.getElementById('badge-grade');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const modeTabsEl = document.getElementById('mode-tabs');

  reportEl.toolId = vurDefinition.id;
  reportEl.definition = vurDefinition;
  reportEl.setTemplates(vurTemplates);

  const formState = { grade: null, side: null, phase: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function renderModeTabs() {
    modeTabsEl.innerHTML = '';
    [{ id: 'vcug', label: 'VCUG' }, { id: 'nuclear', label: 'Nuclear Medicine' }].forEach((m) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${mode === m.id ? 'active' : ''}`;
      tab.textContent = m.label;
      tab.addEventListener('click', () => { mode = m.id; formState.grade = null; renderModeTabs(); buildUI(); });
      modeTabsEl.appendChild(tab);
    });
  }

  function buildUI() {
    stepContainer.innerHTML = '';

    // Side + phase
    const metaCard = document.createElement('div');
    metaCard.className = 'card';
    metaCard.innerHTML = `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap;">
        <div class="input-group"><label>Side</label><div class="toggle-group">${vurDefinition.sideOptions.map((o) => `<button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}" data-field="side" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>
        <div class="input-group"><label>Phase</label><div class="toggle-group">${vurDefinition.phaseOptions.map((o) => `<button class="toggle-group__btn ${formState.phase === o.id ? 'toggle-group__btn--active' : ''}" data-field="phase" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>
      </div>
    `;
    metaCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState[btn.dataset.field] = btn.dataset.value;
        metaCard.querySelectorAll(`.toggle-group__btn[data-field="${btn.dataset.field}"]`).forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(metaCard);

    // Grade
    const grades = mode === 'vcug' ? vurDefinition.vcugGrades : vurDefinition.nuclearGrades;
    const gradeCard = document.createElement('div');
    gradeCard.className = 'step-card card';
    gradeCard.innerHTML = `<div class="step-card__question">${mode === 'vcug' ? 'VCUG' : 'Nuclear Medicine'} Grade</div><div style="display:flex; flex-direction:column; gap:var(--space-xs);">${grades.map((g) => `<button class="benign-choice ${formState.grade === g.id ? 'benign-choice--active' : ''}" data-grade="${g.id}" style="text-align:left; justify-content:flex-start;">${g.label} — ${g.description}</button>`).join('')}</div>`;
    gradeCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => { formState.grade = btn.dataset.grade; gradeCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.grade === formState.grade)); update(); });
    });
    stepContainer.appendChild(gradeCard);
    update();
  }

  function update() { const r = calculateVur(formState, mode); badgeGrade.textContent = r.grade; badgeGrade.dataset.level = r.level; updateReport(); }

  function updateReport() {
    const data = calculateVur(formState, mode);
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
