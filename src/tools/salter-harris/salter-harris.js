import '../../styles/base.css';
import '../../styles/forms.css';
import './salter-harris.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { salterHarrisDefinition } from './definition.js';
import { calculateSalterHarris } from './calculator.js';
import { parseFindings } from '../../core/parser.js';
import { salterHarrisTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { initKeyboardShortcuts } from '../../core/keyboard-shortcuts.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:salter-harris:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeType = document.getElementById('badge-type');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = salterHarrisDefinition.id;
  reportEl.definition = salterHarrisDefinition;
  reportEl.setTemplates(salterHarrisTemplates);

  const formState = { type: null, location: '' };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Location input
    const locCard = document.createElement('div');
    locCard.className = 'card';
    locCard.innerHTML = `
      <div class="input-group">
        <label for="sh-location">Location</label>
        <input type="text" id="sh-location" value="${formState.location}" placeholder="e.g. Distal radius, Distal femur">
      </div>
    `;
    locCard.querySelector('#sh-location').addEventListener('input', (e) => { formState.location = e.target.value; update(); });
    stepContainer.appendChild(locCard);

    // Type selection
    const typeCard = document.createElement('div');
    typeCard.className = 'step-card card';
    typeCard.innerHTML = `
      <div class="step-card__question">Fracture Type (SALTR)</div>
      <div class="sh-type-grid">
        ${salterHarrisDefinition.types.map((t) => `
          <button class="benign-choice sh-type-btn ${formState.type === t.id ? 'benign-choice--active' : ''}"
            data-type="${t.id}">
            ${t.image ? `<img class="sh-option-img" src="${t.image}" alt="${t.label}">` : ''}
            <span class="sh-type-label">${t.label}</span>
            <span style="font-size:var(--text-xs); color:var(--text-muted);">${t.anatomy}</span>
          </button>
        `).join('')}
      </div>
    `;
    typeCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.type = btn.dataset.type;
        typeCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.type === formState.type));
        update();
      });
    });
    stepContainer.appendChild(typeCard);

    update();
  }

  function update() {
    const result = calculateSalterHarris(formState);
    badgeType.textContent = result.type;
    badgeType.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateSalterHarris(formState);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, salterHarrisDefinition);
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
  initKeyboardShortcuts({ container: stepContainer });
}

document.addEventListener('DOMContentLoaded', init);
