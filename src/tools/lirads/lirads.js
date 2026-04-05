import '../../styles/base.css';
import '../../styles/forms.css';
import './lirads.css';
import '../../components/report-output.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { liradsDefinition } from './definition.js';
import { calculateLirads } from './calculator.js';
import { liradsTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';

const formState = {};

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const categoryDisplay = document.getElementById('lirads-category');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = liradsDefinition.id;
  reportEl.setTemplates(liradsTemplates);

  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  // --- Build the entire UI once ---
  buildUI();

  function buildUI() {
    stepContainer.innerHTML = '';

    // Location input
    const locDef = liradsDefinition.locationInput;
    const locCard = document.createElement('div');
    locCard.className = 'step-card card';
    locCard.innerHTML = `
      <label class="step-card__label" for="input-location">${locDef.label}</label>
      <select id="input-location" class="step-card__select">
        <option value="">Select segment...</option>
        ${locDef.options.map((o) => `<option value="${o.id}">${o.label}</option>`).join('')}
      </select>
    `;
    locCard.querySelector('select').addEventListener('change', (e) => {
      formState.location = e.target.value || null;
      update();
    });
    stepContainer.appendChild(locCard);

    // Decision tree steps
    for (const step of liradsDefinition.steps) {
      const card = document.createElement('div');
      card.className = 'step-card card';
      card.dataset.stepId = step.id;

      card.innerHTML = `
        <div class="step-card__question">${step.question}</div>
        ${step.hint ? `<div class="step-card__hint">${step.hint}</div>` : ''}
        <div class="step-card__buttons">
          <button class="step-btn" data-step="${step.id}" data-value="yes">Yes</button>
          <button class="step-btn" data-step="${step.id}" data-value="no">No</button>
        </div>
        <div class="step-card__result"></div>
      `;

      card.querySelectorAll('.step-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          formState[step.id] = btn.dataset.value;
          updateStepStates();
          update();
        });
      });

      stepContainer.appendChild(card);
    }

    // Major features card
    const majorCard = document.createElement('div');
    majorCard.className = 'step-card card step-card--major';
    majorCard.id = 'major-features';

    let majorHtml = '<div class="step-card__question">Major Features</div>';
    for (const feature of liradsDefinition.majorFeatures) {
      if (feature.inputType === 'integer') {
        majorHtml += `
          <div class="major-feature">
            <label class="major-feature__label">${feature.label}</label>
            <div class="input-with-unit">
              <input type="number" id="input-${feature.id}" min="${feature.min}" max="${feature.max}" step="${feature.step}"
                placeholder="${feature.placeholder || ''}">
              <span class="unit-label">${feature.unit}</span>
            </div>
          </div>`;
      } else if (feature.inputType === 'yes-no') {
        majorHtml += `
          <div class="major-feature">
            <label class="major-feature__label">${feature.label}</label>
            ${feature.description ? `<span class="major-feature__desc">${feature.description}</span>` : ''}
            <div class="step-card__buttons">
              <button class="step-btn" data-feature="${feature.id}" data-value="yes">Present</button>
              <button class="step-btn" data-feature="${feature.id}" data-value="no">Absent</button>
            </div>
          </div>`;
      }
    }
    majorCard.innerHTML = majorHtml;

    majorCard.querySelectorAll('input[type="number"]').forEach((el) => {
      el.addEventListener('input', () => {
        const id = el.id.replace('input-', '');
        formState[id] = el.value !== '' ? parseInt(el.value, 10) : null;
        update();
      });
    });

    majorCard.querySelectorAll('.step-btn[data-feature]').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState[btn.dataset.feature] = btn.dataset.value;
        const siblings = majorCard.querySelectorAll(`.step-btn[data-feature="${btn.dataset.feature}"]`);
        siblings.forEach((s) => s.classList.toggle('step-btn--active', s === btn));
        update();
      });
    });

    stepContainer.appendChild(majorCard);

    // Ancillary features card
    const anc = liradsDefinition.ancillaryFeatures;
    const ancCard = document.createElement('div');
    ancCard.className = 'step-card card step-card--ancillary';
    ancCard.id = 'ancillary-features';
    ancCard.innerHTML = `
      <details class="ancillary-details">
        <summary class="step-card__question">Ancillary Features <span class="step-card__hint">(optional — may adjust category ±1)</span></summary>
        <div class="ancillary-group">
          <h4 class="ancillary-group__title">Favoring HCC (upgrade)</h4>
          ${anc.favoringHCC.map((f) => `
            <label class="ancillary-check">
              <input type="checkbox" data-key="anc_hcc_${f.id}">
              ${f.label}
            </label>
          `).join('')}
        </div>
        <div class="ancillary-group">
          <h4 class="ancillary-group__title">Favoring Benign (downgrade)</h4>
          ${anc.favoringBenign.map((f) => `
            <label class="ancillary-check">
              <input type="checkbox" data-key="anc_benign_${f.id}">
              ${f.label}
            </label>
          `).join('')}
        </div>
      </details>
    `;

    ancCard.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', () => {
        formState[cb.dataset.key] = cb.checked;
        update();
      });
    });

    stepContainer.appendChild(ancCard);

    // Initial state
    updateStepStates();
  }

  // --- Update step visibility/states without rebuilding DOM ---
  function updateStepStates() {
    let earlyExitHit = false;

    for (const step of liradsDefinition.steps) {
      const card = stepContainer.querySelector(`[data-step-id="${step.id}"]`);
      if (!card) continue;

      const val = formState[step.id];
      const isEarlyExit = val === 'yes' && step.earlyExit?.yes;

      // Disable cards after an early exit
      card.classList.toggle('step-card--disabled', earlyExitHit);
      card.classList.toggle('step-card--exit', isEarlyExit);

      // Update button active states
      card.querySelectorAll('.step-btn').forEach((btn) => {
        btn.classList.toggle('step-btn--active', btn.dataset.value === val);
        btn.disabled = earlyExitHit;
      });

      // Show/hide result badge via opacity (no layout shift)
      const resultEl = card.querySelector('.step-card__result');
      if (isEarlyExit) {
        resultEl.textContent = step.earlyExit.yes;
        resultEl.classList.add('step-card__result--visible');
      } else {
        resultEl.classList.remove('step-card__result--visible');
      }

      if (isEarlyExit) earlyExitHit = true;
    }

    // Show/hide major features and ancillary
    const majorEl = document.getElementById('major-features');
    const ancEl = document.getElementById('ancillary-features');
    majorEl.classList.toggle('step-card--disabled', earlyExitHit);
    ancEl.classList.toggle('step-card--disabled', earlyExitHit);
  }

  // --- Update ---
  function update() {
    const result = calculateLirads(formState);
    categoryDisplay.textContent = result.categoryFullLabel;
    categoryDisplay.dataset.level = result.categoryLevel;
    updateReport();
  }

  function updateReport() {
    const result = calculateLirads(formState);

    const data = {
      ...result,
      apheLabel: formState.aphe === 'yes' ? 'Present' : formState.aphe === 'no' ? 'Absent' : 'Not assessed',
      washoutLabel: formState.washout === 'yes' ? 'Present' : formState.washout === 'no' ? 'Absent' : 'Not assessed',
      capsuleLabel: formState.capsule === 'yes' ? 'Present' : formState.capsule === 'no' ? 'Absent' : 'Not assessed',
      thresholdGrowthLabel: formState.thresholdGrowth === 'yes' ? 'Present' : formState.thresholdGrowth === 'no' ? 'Absent' : 'Not assessed',
      hasAdjustment: !!result.adjustmentNote,
    };

    if (formState.location) {
      const opt = liradsDefinition.locationInput.options.find((o) => o.id === formState.location);
      data.location = opt?.label || '';
      data.locationProvided = true;
    } else {
      data.location = '';
      data.locationProvided = false;
    }

    const loc = data.locationProvided ? `${data.location} ` : '';
    const size = data.sizeProvided ? `${data.sizeMm} mm ` : '';
    data.impressionSummary = `${loc}${size}liver observation: ${data.categoryFullLabel}. ${data.management}`;

    reportEl.renderFn = (config, _data) => {
      const blocks = config.blocks || [];
      const sections = [];

      sections.push('FINDINGS:\n' + renderBlocks(blocks, data, false));

      if (studyAdditionalFindings.trim()) {
        sections.push('ADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim());
      }

      if (config.impression?.enabled && config.impression?.template) {
        sections.push(renderReport(config.impression.template, data));
      }

      return sections.join('\n\n');
    };

    reportEl.updateReport(data);
  }

  // --- Restore form state (for parse) ---
  function restoreUI() {
    // Restore step buttons
    updateStepStates();

    // Restore major feature buttons
    const majorCard = document.getElementById('major-features');
    for (const feature of liradsDefinition.majorFeatures) {
      if (feature.inputType === 'integer') {
        const el = majorCard.querySelector(`#input-${feature.id}`);
        if (el) el.value = formState[feature.id] ?? '';
      } else if (feature.inputType === 'yes-no') {
        majorCard.querySelectorAll(`.step-btn[data-feature="${feature.id}"]`).forEach((btn) => {
          btn.classList.toggle('step-btn--active', btn.dataset.value === formState[feature.id]);
        });
      }
    }

    // Restore location
    const locSelect = document.getElementById('input-location');
    if (locSelect) locSelect.value = formState.location || '';

    // Restore ancillary checkboxes
    document.querySelectorAll('.ancillary-check input').forEach((cb) => {
      cb.checked = !!formState[cb.dataset.key];
    });
  }

  // --- Parse ---
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');

  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;

    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, liradsDefinition);

    // Clear and replace form state
    for (const key of Object.keys(formState)) delete formState[key];
    Object.assign(formState, parsed);

    // All early-exit steps default to 'no' if not parsed
    for (const step of liradsDefinition.steps) {
      if (formState[step.id] == null) formState[step.id] = 'no';
    }

    additionalFindingsEl.value = remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;

    restoreUI();
    update();

    const total = matched.length + unmatched.length;
    parseStatus.textContent = `Matched ${matched.length}/${total} fields${remainder ? ' — remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => {
      parseStatus.textContent = '';
      parseStatus.className = 'parse-panel__status';
    }, 5000);
  });

  // Initial update
  update();
}

document.addEventListener('DOMContentLoaded', init);
