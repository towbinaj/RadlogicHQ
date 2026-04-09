import '../../styles/base.css';
import '../../styles/forms.css';
import './idrf.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { idrfDefinition } from './definition.js';
import { calculateIdrf } from './calculator.js';
import { idrfTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const stageDisplay = document.getElementById('idrf-stage');
  const countDisplay = document.getElementById('idrf-count');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = idrfDefinition.id;
  reportEl.definition = idrfDefinition;
  reportEl.setTemplates(idrfTemplates);

  const formState = {};
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = idrfDefinition;

    // Block 1: Primary tumor location
    const locCard = document.createElement('div');
    locCard.className = 'primary-inputs card';
    locCard.innerHTML = `
      <div class="primary-input-item input-group">
        <label for="input-location">Primary Tumor Location</label>
        <select id="input-location">
          <option value="">Select location...</option>
          ${def.primaryInputs[0].options.map((o) =>
            `<option value="${o.id}" ${formState.location === o.id ? 'selected' : ''}>${o.label}</option>`
          ).join('')}
        </select>
      </div>
    `;
    locCard.querySelector('#input-location').addEventListener('change', (e) => {
      formState.location = e.target.value || null;
      update();
    });
    stepContainer.appendChild(locCard);

    // IDRF factor groups — rendered as ancillary-style toggle cards
    for (const group of def.idrfGroups) {
      const groupCard = document.createElement('div');
      groupCard.className = 'step-card card';
      groupCard.innerHTML = `
        <div class="step-card__question">${group.title}</div>
        <div class="ancillary-grid idrf-grid">
          ${group.factors.map((f) => `
            <button class="ancillary-card ${formState[f.id] === true ? 'selected' : ''}"
              data-factor="${f.id}" ${f.tooltip ? `title="${esc(f.tooltip)}"` : ''}>${f.label}</button>
          `).join('')}
        </div>
      `;
      groupCard.querySelectorAll('.ancillary-card').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.factor;
          formState[id] = !formState[id];
          btn.classList.toggle('selected', formState[id]);
          update();
        });
      });
      stepContainer.appendChild(groupCard);
    }

    update();
  }

  function update() {
    const result = calculateIdrf(formState);
    stageDisplay.textContent = result.stage;
    stageDisplay.dataset.level = result.stageLevel;
    countDisplay.textContent = result.idrfCount;
    countDisplay.style.color = result.idrfPresent ? 'var(--danger)' : 'var(--success)';
    updateReport();
  }

  function updateReport() {
    const result = calculateIdrf(formState);
    const data = { ...result };

    const impressionParts = [];
    if (data.locationProvided) impressionParts.push(`${data.locationLabel} neuroblastoma.`);
    impressionParts.push(data.stageFullLabel + '.');
    if (data.idrfPresent) {
      impressionParts.push(`IDRFs: ${data.idrfFactorList}.`);
    } else if (data.stage === 'L1') {
      impressionParts.push('No IDRFs identified.');
    }
    const impressionSummary = impressionParts.join(' ');

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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, idrfDefinition);
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
