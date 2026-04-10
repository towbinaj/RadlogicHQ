import '../../styles/base.css';
import '../../styles/forms.css';
import './pretext.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { pretextDefinition } from './definition.js';
import { calculatePretext } from './calculator.js';
import { pretextTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';
import { getSizeUnit, setStored } from '../../core/storage.js';

let sizeUnit = getSizeUnit('pretext');

function displaySize(sizeMm) {
  if (sizeMm == null || isNaN(sizeMm)) return '';
  return sizeUnit === 'cm' ? (sizeMm / 10).toFixed(1) : sizeMm;
}

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const groupDisplay = document.getElementById('pretext-group');
  const annotationsDisplay = document.getElementById('pretext-annotations');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = pretextDefinition.id;
  reportEl.definition = pretextDefinition;
  reportEl.setTemplates(pretextTemplates);

  const formState = {};
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = pretextDefinition;

    // Block 1: Max diameter
    const sizeCard = document.createElement('div');
    sizeCard.className = 'primary-inputs card';
    sizeCard.innerHTML = `
      <div class="primary-input-item input-group">
        <label for="input-size">Max Axial Diameter</label>
        <div class="input-with-unit">
          <input type="number" id="input-size" class="no-spinner" min="0.1" max="300" step="0.1" placeholder="${sizeUnit === 'mm' ? 'e.g., 80' : 'e.g., 8.0'}" value="${displaySize(formState.maxDiameter) ?? ''}">
          <div class="unit-toggle">
            <button class="unit-toggle__btn ${sizeUnit === 'mm' ? 'active' : ''}" data-unit="mm">mm</button>
            <button class="unit-toggle__btn ${sizeUnit === 'cm' ? 'active' : ''}" data-unit="cm">cm</button>
          </div>
        </div>
      </div>
    `;
    sizeCard.querySelector('#input-size').addEventListener('input', (e) => {
      const raw = e.target.value !== '' ? parseFloat(e.target.value) : null;
      formState.maxDiameter = raw != null ? (sizeUnit === 'cm' ? Math.round(raw * 100) / 10 : raw) : null;
      update();
    });
    sizeCard.querySelectorAll('.unit-toggle__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.unit === sizeUnit) return;
        sizeUnit = btn.dataset.unit;
        setStored('sizeUnit:pretext', sizeUnit);
        buildUI();
      });
    });
    stepContainer.appendChild(sizeCard);

    // Block 2: Liver sections — clickable grid
    const sectionsCard = document.createElement('div');
    sectionsCard.className = 'step-card card';
    sectionsCard.innerHTML = `
      <div class="step-card__question">Liver Sections Involved</div>
      <div class="pretext-sections">
        ${def.sections.map((s) => `
          <button class="pretext-section-btn ${formState[s.id] === 'yes' ? 'pretext-section-btn--active' : ''}"
            data-section="${s.id}">${s.label}</button>
        `).join('')}
      </div>
    `;
    sectionsCard.querySelectorAll('.pretext-section-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.section;
        formState[id] = formState[id] === 'yes' ? 'no' : 'yes';
        btn.classList.toggle('pretext-section-btn--active', formState[id] === 'yes');
        update();
      });
    });
    stepContainer.appendChild(sectionsCard);

    // Block 3: Annotation factors
    const annCard = document.createElement('div');
    annCard.className = 'step-card card';
    annCard.innerHTML = `
      <div class="step-card__question">Annotation Factors</div>
      ${def.annotations.map((ann) => `
        <div class="major-feature">
          <span class="major-feature__label" ${ann.tooltip ? `title="${esc(ann.tooltip)}"` : ''}>${ann.label}</span>
          <div class="step-card__buttons">
            ${def.annotationOptions.map((o) => `
              <button class="step-btn ${formState['ann_' + ann.id] === o.id ? 'step-btn--active' : ''}"
                data-ann="${ann.id}" data-value="${o.id}">${o.label}</button>
            `).join('')}
          </div>
        </div>
      `).join('')}
    `;
    annCard.querySelectorAll('.step-btn[data-ann]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = 'ann_' + btn.dataset.ann;
        formState[key] = btn.dataset.value;
        annCard.querySelectorAll(`.step-btn[data-ann="${btn.dataset.ann}"]`).forEach((b) =>
          b.classList.toggle('step-btn--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(annCard);

    update();
  }

  function update() {
    const result = calculatePretext(formState);
    groupDisplay.textContent = result.groupLabel;
    groupDisplay.dataset.level = result.groupLevel;
    annotationsDisplay.textContent = result.annotationSummary;
    updateReport();
  }

  function updateReport() {
    const result = calculatePretext(formState);
    const data = { ...result };

    const summaryParts = [];
    if (data.sizeProvided) summaryParts.push(`${data.sizeMm} mm`);
    summaryParts.push(data.groupLabel);
    if (data.positiveAnnotations.length > 0) {
      summaryParts.push(`Annotations: ${data.positiveAnnotations.join(', ')}`);
    }
    const impressionSummary = `Hepatoblastoma, ${summaryParts.join('. ')}.`;

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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, pretextDefinition);
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
