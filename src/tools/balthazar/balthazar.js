import '../../styles/base.css';
import '../../styles/forms.css';
import './balthazar.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { balthazarDefinition } from './definition.js';
import { calculateBalthazar } from './calculator.js';
import { parseFindings } from '../../core/parser.js';
import { balthazarTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:balthazar:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeCtsi = document.getElementById('badge-ctsi');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = balthazarDefinition.id;
  reportEl.definition = balthazarDefinition;
  reportEl.setTemplates(balthazarTemplates);

  const formState = { grade: null, necrosis: null };
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = balthazarDefinition;

    // Balthazar grade
    const gradeCard = document.createElement('div');
    gradeCard.className = 'step-card card';
    gradeCard.innerHTML = `
      <div class="step-card__question">Balthazar Grade</div>
      <div class="benign-choices" style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${def.gradeOptions.map((g) => `
          <button class="benign-choice ${formState.grade === g.id ? 'benign-choice--active' : ''}"
            data-grade="${g.id}" style="text-align:left; justify-content:flex-start;">${g.label}</button>
        `).join('')}
      </div>
    `;
    gradeCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.grade = btn.dataset.grade;
        gradeCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b.dataset.grade === formState.grade));
        update();
      });
    });
    stepContainer.appendChild(gradeCard);

    // Necrosis
    const necCard = document.createElement('div');
    necCard.className = 'step-card card';
    necCard.innerHTML = `
      <div class="step-card__question">Pancreatic Necrosis</div>
      <div class="benign-choices" style="display:flex; gap:var(--space-xs); flex-wrap:wrap;">
        ${def.necrosisOptions.map((n) => `
          <button class="benign-choice ${formState.necrosis === n.id ? 'benign-choice--active' : ''}"
            data-necrosis="${n.id}">${n.label} (${n.points} pts)</button>
        `).join('')}
      </div>
    `;
    necCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.necrosis = btn.dataset.necrosis;
        necCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b.dataset.necrosis === formState.necrosis));
        update();
      });
    });
    stepContainer.appendChild(necCard);

    update();
  }

  function update() {
    const result = calculateBalthazar(formState);
    badgeCtsi.textContent = result.ctsiLabel;
    badgeCtsi.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateBalthazar(formState);
    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        let text = renderEditorContent(config.editorContent, config.pillStates, data);
        if (studyAdditionalFindings.trim()) text += '\n\n' + (config.sectionHeaders?.additionalFindings ?? 'Other findings:') + '\n' + studyAdditionalFindings.trim();
        return text;
      }
      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];
      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + renderBlocks(blocks, data, false));
      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      const otherFindings = studyAdditionalFindings.trim() || 'None.';
      sections.push((headers.additionalFindings ?? 'Other findings:') + '\n' + otherFindings);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, balthazarDefinition);
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
