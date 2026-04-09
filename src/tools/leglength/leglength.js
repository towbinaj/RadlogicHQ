import '../../styles/base.css';
import '../../styles/forms.css';
import './leglength.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { leglengthDefinition } from './definition.js';
import { calculateLegLength } from './calculator.js';
import { leglengthTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const discDisplay = document.getElementById('ll-discrepancy');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = leglengthDefinition.id;
  reportEl.definition = leglengthDefinition;
  reportEl.setTemplates(leglengthTemplates);

  const formState = {};
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = leglengthDefinition;

    // Block 1: Measurements — right and left leg lengths side by side
    const measureCard = document.createElement('div');
    measureCard.className = 'primary-inputs card';
    measureCard.innerHTML = `
      <div class="primary-input-item input-group">
        <label for="input-right-length">Right Leg (cm)</label>
        <input type="number" id="input-right-length" class="no-spinner" min="0.1" max="200" step="0.1" placeholder="e.g., 78.5" value="${formState.rightLength ?? ''}">
      </div>
      <div class="primary-input-item input-group">
        <label for="input-left-length">Left Leg (cm)</label>
        <input type="number" id="input-left-length" class="no-spinner" min="0.1" max="200" step="0.1" placeholder="e.g., 79.2" value="${formState.leftLength ?? ''}">
      </div>
    `;
    measureCard.querySelector('#input-right-length').addEventListener('input', (e) => {
      formState.rightLength = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    measureCard.querySelector('#input-left-length').addEventListener('input', (e) => {
      formState.leftLength = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    stepContainer.appendChild(measureCard);

    // Block 2: Right knee alignment
    const rightAlignCard = document.createElement('div');
    rightAlignCard.className = 'step-card card';
    rightAlignCard.innerHTML = `
      <div class="step-card__question">Right Knee Alignment</div>
      <div class="benign-choices">
        ${def.alignmentOptions.map((o) => `
          <button class="benign-choice ${formState.rightAlignment === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}">${o.label}</button>
        `).join('')}
      </div>
    `;
    rightAlignCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.rightAlignment = btn.dataset.value;
        rightAlignCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(rightAlignCard);

    // Block 3: Left knee alignment
    const leftAlignCard = document.createElement('div');
    leftAlignCard.className = 'step-card card';
    leftAlignCard.innerHTML = `
      <div class="step-card__question">Left Knee Alignment</div>
      <div class="benign-choices">
        ${def.alignmentOptions.map((o) => `
          <button class="benign-choice ${formState.leftAlignment === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}">${o.label}</button>
        `).join('')}
      </div>
    `;
    leftAlignCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.leftAlignment = btn.dataset.value;
        leftAlignCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(leftAlignCard);

    // Block 4: Physes
    const physesCard = document.createElement('div');
    physesCard.className = 'step-card card';
    physesCard.innerHTML = `
      <div class="step-card__question">Physes</div>
      <div class="benign-choices">
        ${def.physesOptions.map((o) => `
          <button class="benign-choice ${formState.physes === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}">${o.label}</button>
        `).join('')}
      </div>
    `;
    physesCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.physes = btn.dataset.value;
        physesCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(physesCard);

    update();
  }

  function update() {
    const result = calculateLegLength(formState);

    if (result.bothProvided && result.discrepancy != null) {
      if (result.longerSide === 'equal') {
        discDisplay.textContent = 'Equal';
      } else {
        discDisplay.textContent = `${result.discrepancy} cm`;
      }
    } else {
      discDisplay.textContent = '--';
    }

    updateReport();
  }

  function updateReport() {
    const result = calculateLegLength(formState);
    const data = { ...result };

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        const merged = { ...data };
        let text = renderEditorContent(config.editorContent, config.pillStates, merged);
        if (studyAdditionalFindings.trim()) {
          const header = config.sectionHeaders?.additionalFindings ?? 'Other findings:';
          text += '\n\n' + header + '\n' + studyAdditionalFindings.trim();
        }
        return text;
      }

      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];

      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + renderBlocks(blocks, data, false));

      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));

      const otherFindings = studyAdditionalFindings.trim() || 'None.';
      sections.push((headers.additionalFindings ?? 'Other findings:') + '\n' + otherFindings);

      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, data));
      }

      return sections.join('\n\n');
    };
    reportEl.updateReport(data);
  }

  // --- Parse ---
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, leglengthDefinition);
    for (const key of Object.keys(formState)) delete formState[key];
    Object.assign(formState, parsed);
    additionalFindingsEl.value = remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;
    buildUI();
    const total = matched.length + unmatched.length;
    parseStatus.textContent = `Matched ${matched.length}/${total}${remainder ? ' — remainder in Other Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
