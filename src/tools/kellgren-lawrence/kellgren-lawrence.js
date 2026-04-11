import '../../styles/base.css';
import '../../styles/forms.css';
import './kellgren-lawrence.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { klDefinition } from './definition.js';
import { calculateKL } from './calculator.js';
import { parseFindings } from '../../core/parser.js';
import { klTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';

function init() {
  trackEvent('tool:kellgren-lawrence:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeGrade = document.getElementById('badge-grade');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = klDefinition.id;
  reportEl.definition = klDefinition;
  reportEl.setTemplates(klTemplates);

  const formState = { grade: null, joint: null, side: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = klDefinition;

    // Joint + side
    const metaCard = document.createElement('div');
    metaCard.className = 'card';
    metaCard.innerHTML = `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap;">
        <div class="input-group" style="flex:1; min-width:120px;">
          <label>Joint</label>
          <div class="toggle-group">
            ${def.jointOptions.map((o) => `
              <button class="toggle-group__btn ${formState.joint === o.id ? 'toggle-group__btn--active' : ''}"
                data-field="joint" data-value="${o.id}">${o.label}</button>
            `).join('')}
          </div>
        </div>
        <div class="input-group" style="flex:1; min-width:120px;">
          <label>Side</label>
          <div class="toggle-group">
            ${def.sideOptions.map((o) => `
              <button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}"
                data-field="side" data-value="${o.id}">${o.label}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    metaCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState[btn.dataset.field] = btn.dataset.value;
        metaCard.querySelectorAll(`.toggle-group__btn[data-field="${btn.dataset.field}"]`).forEach((b) =>
          b.classList.toggle('toggle-group__btn--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(metaCard);

    // Grade selection
    const gradeCard = document.createElement('div');
    gradeCard.className = 'step-card card';
    gradeCard.innerHTML = `
      <div class="step-card__question">OA Grade</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${def.grades.map((g) => `
          <button class="benign-choice ${formState.grade === g.id ? 'benign-choice--active' : ''}"
            data-grade="${g.id}" style="text-align:left; justify-content:flex-start;">
            ${g.label}<br><span style="font-size:var(--text-xs); color:var(--text-muted);">${g.findings}</span>
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
    const result = calculateKL(formState);
    badgeGrade.textContent = result.grade;
    badgeGrade.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateKL(formState);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, klDefinition);
    Object.assign(formState, parsed);
    additionalFindingsEl.value = remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;
    buildUI();
    const total = matched.length + unmatched.length;
    parseStatus.textContent = `Matched ${matched.length}/${total}${remainder ? ' — remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
