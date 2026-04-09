import '../../styles/base.css';
import '../../styles/forms.css';
import './adrenal-washout.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { adrenalWashoutDefinition } from './definition.js';
import { calculateAdrenalWashout } from './calculator.js';
import { adrenalWashoutTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const absoluteDisplay = document.getElementById('aw-absolute');
  const relativeDisplay = document.getElementById('aw-relative');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = adrenalWashoutDefinition.id;
  reportEl.definition = adrenalWashoutDefinition;
  reportEl.setTemplates(adrenalWashoutTemplates);

  const formState = {};
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = adrenalWashoutDefinition;

    // Block 1: Side
    const sideCard = document.createElement('div');
    sideCard.className = 'step-card card';
    sideCard.innerHTML = `
      <div class="step-card__question">Side</div>
      <div class="benign-choices">
        ${def.sideOptions.map((o) => `
          <button class="benign-choice ${formState.side === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}">${o.label}</button>
        `).join('')}
      </div>
    `;
    sideCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.side = btn.dataset.value;
        sideCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(sideCard);

    // Block 2: HU measurements
    const measureCard = document.createElement('div');
    measureCard.className = 'card aw-measure-card';
    measureCard.innerHTML = `
      <div class="step-card__question">Attenuation (HU)</div>
      <div class="aw-inputs">
        <div class="aw-input-item input-group">
          <label for="input-unenh">Unenhanced</label>
          <input type="number" id="input-unenh" class="no-spinner" step="1" placeholder="HU" value="${formState.unenhanced ?? ''}">
        </div>
        <div class="aw-input-item input-group">
          <label for="input-enh">Enhanced</label>
          <input type="number" id="input-enh" class="no-spinner" step="1" placeholder="HU" value="${formState.enhanced ?? ''}">
        </div>
        <div class="aw-input-item input-group">
          <label for="input-del">Delayed (15 min)</label>
          <input type="number" id="input-del" class="no-spinner" step="1" placeholder="HU" value="${formState.delayed ?? ''}">
        </div>
      </div>
    `;
    measureCard.querySelector('#input-unenh').addEventListener('input', (e) => {
      formState.unenhanced = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    measureCard.querySelector('#input-enh').addEventListener('input', (e) => {
      formState.enhanced = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    measureCard.querySelector('#input-del').addEventListener('input', (e) => {
      formState.delayed = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    stepContainer.appendChild(measureCard);

    update();
  }

  function update() {
    const result = calculateAdrenalWashout(formState);

    if (result.absoluteProvided) {
      absoluteDisplay.textContent = result.absoluteWashoutLabel;
      absoluteDisplay.dataset.level = result.absoluteWashout >= 60 ? 'adenoma' : 'indeterminate';
    } else {
      absoluteDisplay.textContent = '--';
      absoluteDisplay.dataset.level = '';
    }

    if (result.relativeProvided) {
      relativeDisplay.textContent = result.relativeWashoutLabel;
      relativeDisplay.dataset.level = result.relativeWashout >= 40 ? 'adenoma' : 'indeterminate';
    } else {
      relativeDisplay.textContent = '--';
      relativeDisplay.dataset.level = '';
    }

    updateReport();
  }

  function updateReport() {
    const result = calculateAdrenalWashout(formState);
    const data = { ...result };

    let impressionSummary = '';
    if (result.sideProvided) impressionSummary += `${result.sideLabel} adrenal lesion. `;
    if (result.hasResult) impressionSummary += result.interpretation;

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        let text = renderEditorContent(config.editorContent, config.pillStates, { ...data, impressionSummary });
        if (studyAdditionalFindings.trim()) {
          text += '\n\nADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim();
        }
        return text;
      }

      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];

      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + renderBlocks(blocks, data, false));
      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      if (studyAdditionalFindings.trim()) sections.push((headers.additionalFindings ?? 'ADDITIONAL FINDINGS:') + '\n' + studyAdditionalFindings.trim());
      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, { impressionSummary }));
      }
      return sections.join('\n\n');
    };
    reportEl.updateReport(data);
  }

  // Parse
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, adrenalWashoutDefinition);
    for (const key of Object.keys(formState)) delete formState[key];
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
