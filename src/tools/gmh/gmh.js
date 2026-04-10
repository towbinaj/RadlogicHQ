import '../../styles/base.css';
import '../../styles/forms.css';
import './gmh.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { gmhDefinition } from './definition.js';
import { calculateGmh } from './calculator.js';
import { gmhTemplates } from './templates.js';

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeGrade = document.getElementById('badge-grade');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = gmhDefinition.id;
  reportEl.definition = gmhDefinition;
  reportEl.setTemplates(gmhTemplates);

  const formState = { grade: null, side: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Side
    const sideCard = document.createElement('div');
    sideCard.className = 'card';
    sideCard.innerHTML = `<div class="input-group"><label>Side</label><div class="toggle-group">${gmhDefinition.sideOptions.map((o) => `<button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>`;
    sideCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => { formState.side = btn.dataset.value; sideCard.querySelectorAll('.toggle-group__btn').forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn)); update(); });
    });
    stepContainer.appendChild(sideCard);

    // Grade
    const gradeCard = document.createElement('div');
    gradeCard.className = 'step-card card';
    gradeCard.innerHTML = `<div class="step-card__question">Hemorrhage Grade</div><div style="display:flex; flex-direction:column; gap:var(--space-xs);">${gmhDefinition.grades.map((g) => `<button class="benign-choice ${formState.grade === g.id ? 'benign-choice--active' : ''}" data-grade="${g.id}" style="text-align:left; justify-content:flex-start;">${g.label} — ${g.description}</button>`).join('')}</div>`;
    gradeCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => { formState.grade = btn.dataset.grade; gradeCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.grade === formState.grade)); update(); });
    });
    stepContainer.appendChild(gradeCard);
    update();
  }

  function update() { const r = calculateGmh(formState); badgeGrade.textContent = r.grade; badgeGrade.dataset.level = r.level; updateReport(); }

  function updateReport() {
    const data = calculateGmh(formState);
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
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
