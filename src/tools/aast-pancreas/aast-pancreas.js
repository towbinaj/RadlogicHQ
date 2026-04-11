import '../../styles/base.css';
import '../../styles/forms.css';
import './aast-pancreas.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { aastPancreasDefinition } from './definition.js';
import { calculateAast } from '../aast-liver/calculator.js';
import { buildAastTemplates } from '../aast-liver/templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

const definition = aastPancreasDefinition;
const templates = buildAastTemplates(definition.organ);

function init() {
  trackEvent('tool:aast-pancreas:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeGrade = document.getElementById('badge-grade');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = definition.id;
  reportEl.definition = definition;
  reportEl.setTemplates(templates);

  const formState = { selectedFindings: new Set(), multipleInjuries: false };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';
    for (const cat of definition.categories) {
      const card = document.createElement('div');
      card.className = 'step-card card';
      card.innerHTML = `
        <div class="step-card__question">${cat.label}</div>
        <div class="aast-category">
          ${cat.findings.map((f) => `
            <button class="benign-choice ${formState.selectedFindings.has(f.id) ? 'benign-choice--active' : ''}"
              data-finding="${f.id}" title="Grade ${f.grade}">${f.label}</button>
          `).join('')}
        </div>
      `;
      card.querySelectorAll('.benign-choice').forEach((btn) => {
        btn.addEventListener('click', () => {
          const fid = btn.dataset.finding;
          if (formState.selectedFindings.has(fid)) { formState.selectedFindings.delete(fid); btn.classList.remove('benign-choice--active'); }
          else { formState.selectedFindings.add(fid); btn.classList.add('benign-choice--active'); }
          update();
        });
      });
      stepContainer.appendChild(card);
    }
    const multiCard = document.createElement('div');
    multiCard.className = 'card';
    multiCard.innerHTML = `<label class="aast-multi-check"><input type="checkbox" id="multi-injuries" ${formState.multipleInjuries ? 'checked' : ''}>Multiple Grade I/II injuries present (advances to Grade III)</label>`;
    multiCard.querySelector('#multi-injuries').addEventListener('change', (e) => { formState.multipleInjuries = e.target.checked; update(); });
    stepContainer.appendChild(multiCard);
    update();
  }

  function update() {
    const result = calculateAast(formState, definition);
    badgeGrade.textContent = result.gradeLabel;
    badgeGrade.dataset.level = result.gradeLevel;
    updateReport();
  }

  function updateReport() {
    const data = calculateAast(formState, definition);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, aastPancreasDefinition);
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
