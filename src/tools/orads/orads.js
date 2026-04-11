import '../../styles/base.css';
import '../../styles/forms.css';
import './orads.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent, splitEditorContent } from '../../core/pill-editor.js';
import { oradsDefinition } from './definition.js';
import { calculateOrads } from './calculator.js';
import { oradsTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';
import { getSizeUnit, setStored , trackEvent } from '../../core/storage.js';
import '../../core/tool-name.js';

let masses = [createMassState(1)];
let activeMassIndex = 0;
let sizeUnit = getSizeUnit('orads');

function createMassState(num) {
  return { id: num, label: `Mass ${num}`, formState: {} };
}

function displaySize(sizeMm) {
  if (sizeMm == null || isNaN(sizeMm)) return '';
  return sizeUnit === 'cm' ? (sizeMm / 10).toFixed(1) : sizeMm;
}

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  trackEvent('tool:orads:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const scoreDisplay = document.getElementById('orads-score');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const massTabsEl = document.getElementById('mass-tabs');

  reportEl.toolId = oradsDefinition.id;
  reportEl.definition = oradsDefinition;
  reportEl.setTemplates(oradsTemplates);

  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function renderMassTabs() {
    massTabsEl.innerHTML = '';
    masses.forEach((m, i) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${i === activeMassIndex ? 'active' : ''}`;
      tab.textContent = m.label;
      tab.addEventListener('click', () => { activeMassIndex = i; renderMassTabs(); buildUI(); });
      tab.addEventListener('dblclick', () => {
        const n = prompt('Rename:', m.label);
        if (n?.trim()) { m.label = n.trim(); renderMassTabs(); updateReport(); }
      });
      massTabsEl.appendChild(tab);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'obs-tab obs-tab--add';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => {
      masses.push(createMassState(masses.length + 1));
      activeMassIndex = masses.length - 1;
      renderMassTabs(); buildUI();
    });
    massTabsEl.appendChild(addBtn);
    if (masses.length > 1) {
      const rmBtn = document.createElement('button');
      rmBtn.className = 'obs-tab obs-tab--remove';
      rmBtn.textContent = '\u2212';
      rmBtn.addEventListener('click', () => {
        masses.splice(activeMassIndex, 1);
        if (activeMassIndex >= masses.length) activeMassIndex = masses.length - 1;
        renderMassTabs(); buildUI();
      });
      massTabsEl.appendChild(rmBtn);
    }
  }

  function buildUI() {
    const fs = masses[activeMassIndex].formState;
    const def = oradsDefinition;
    stepContainer.innerHTML = '';

    // Primary inputs
    const primaryCard = document.createElement('div');
    primaryCard.className = 'primary-inputs card';
    primaryCard.innerHTML = `
      <div class="primary-input-item input-group">
        <label for="input-location">Side</label>
        <select id="input-location">
          <option value="">Select side...</option>
          ${def.primaryInputs[0].options.map((o) =>
            `<option value="${o.id}" ${fs.location === o.id ? 'selected' : ''}>${o.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="primary-input-item input-group">
        <label for="input-size">Size</label>
        <div class="input-with-unit">
          <input type="number" id="input-size" class="no-spinner" min="0.1" max="${sizeUnit === 'mm' ? '500' : '50'}" step="0.1" placeholder="${sizeUnit === 'mm' ? 'e.g., 35' : 'e.g., 3.5'}" value="${displaySize(fs.size) ?? ''}">
          <div class="unit-toggle">
            <button class="unit-toggle__btn ${sizeUnit === 'mm' ? 'active' : ''}" data-unit="mm">mm</button>
            <button class="unit-toggle__btn ${sizeUnit === 'cm' ? 'active' : ''}" data-unit="cm">cm</button>
          </div>
        </div>
      </div>
    `;
    primaryCard.querySelector('#input-location').addEventListener('change', (e) => { fs.location = e.target.value || null; update(); });
    primaryCard.querySelector('#input-size').addEventListener('input', (e) => {
      const raw = e.target.value !== '' ? parseFloat(e.target.value) : null;
      fs.size = raw != null ? (sizeUnit === 'cm' ? Math.round(raw * 100) / 10 : raw) : null;
      update();
    });
    primaryCard.querySelectorAll('.unit-toggle__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.unit === sizeUnit) return;
        sizeUnit = btn.dataset.unit;
        setStored('sizeUnit:orads', sizeUnit);
        buildUI();
      });
    });
    stepContainer.appendChild(primaryCard);

    // Classic benign
    stepContainer.appendChild(buildChoiceCard(def.classicBenign, 'classicBenign', fs));

    // Morphology
    const morphCard = buildChoiceCard(def.morphology, 'morphology', fs);
    morphCard.id = 'morph-card';
    stepContainer.appendChild(morphCard);

    // Color score
    const csCard = buildChoiceCard(def.colorScore, 'colorScore', fs);
    csCard.id = 'color-card';
    stepContainer.appendChild(csCard);

    // Ascites
    stepContainer.appendChild(buildChoiceCard(def.ascites, 'ascites', fs));

    // Peritoneal nodularity
    stepContainer.appendChild(buildChoiceCard(def.peritoneal, 'peritoneal', fs));

    updateDisabled();
    update();
  }

  function buildChoiceCard(featureDef, key, fs) {
    const card = document.createElement('div');
    card.className = 'step-card card';
    card.innerHTML = `
      <div class="step-card__question">
        ${featureDef.label}
        ${featureDef.tooltip ? `<span class="major-feature__label" title="${esc(featureDef.tooltip)}" style="font-weight:400; font-size: var(--text-xs); margin-left: var(--space-xs); cursor: help;">(?)</span>` : ''}
      </div>
      <div class="benign-choices">
        ${featureDef.options.map((o) => `
          <button class="benign-choice ${fs[key] === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}" ${o.tooltip ? `title="${esc(o.tooltip)}"` : ''}>${o.label}</button>
        `).join('')}
      </div>
    `;
    card.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        fs[key] = btn.dataset.value;
        card.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        updateDisabled();
        update();
      });
    });
    return card;
  }

  function updateDisabled() {
    const fs = masses[activeMassIndex].formState;
    const isClassicBenign = fs.classicBenign && fs.classicBenign !== 'no';
    const morphCard = document.getElementById('morph-card');
    const colorCard = document.getElementById('color-card');
    if (morphCard) morphCard.classList.toggle('step-card--disabled', isClassicBenign);
    if (colorCard) colorCard.classList.toggle('step-card--disabled', isClassicBenign);
  }

  function update() {
    const fs = masses[activeMassIndex].formState;
    const result = calculateOrads(fs);
    scoreDisplay.textContent = result.categoryFullLabel;
    scoreDisplay.dataset.level = result.categoryLevel;
    updateReport();
  }

  function updateReport() {
    const allData = masses.map((m) => {
      const result = calculateOrads(m.formState);
      const data = { ...result };
      data.massLabel = m.label;
      if (m.formState.location) {
        const opt = oradsDefinition.primaryInputs[0].options.find((o) => o.id === m.formState.location);
        data.location = opt?.label || '';
        data.locationProvided = true;
      }
      return data;
    });

    const summaryLines = allData.map((d) => {
      const loc = d.locationProvided ? `${d.location} ` : '';
      const size = d.sizeProvided ? `${d.sizeMm} mm ` : '';
      return `${d.massLabel}: ${loc}${size}${d.categoryFullLabel}. ${d.management}`;
    });

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        const impData = { impressionSummary: summaryLines.join('\n') };
        if (masses.length === 1) {
          return renderEditorContent(config.editorContent, config.pillStates, { ...allData[0], ...impData });
        }
        const { findings, impression } = splitEditorContent(config.editorContent);
        let text = allData.map((d) => renderEditorContent(findings, config.pillStates, d)).join('\n\n');
        if (studyAdditionalFindings.trim()) text += '\n\nADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim();
        if (impression.length > 0) text += '\n\n' + renderEditorContent(impression, config.pillStates, { impressionSummary: summaryLines.join('\n') });
        return text;
      }

      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];
      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + (masses.length === 1
        ? renderBlocks(blocks, allData[0], false)
        : allData.map((d) => renderBlocks(blocks, d, false)).join('\n\n')));
      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      if (studyAdditionalFindings.trim()) sections.push((headers.additionalFindings ?? 'ADDITIONAL FINDINGS:') + '\n' + studyAdditionalFindings.trim());
      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, { impressionSummary: summaryLines.join('\n') }));
      }
      return sections.join('\n\n');
    };
    reportEl.updateReport(allData[activeMassIndex]);
  }

  // Parse
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, oradsDefinition);
    const fs = masses[activeMassIndex].formState;
    for (const key of Object.keys(fs)) delete fs[key];
    Object.assign(fs, parsed);
    additionalFindingsEl.value = remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;
    buildUI();
    const total = matched.length + unmatched.length;
    parseStatus.textContent = `Matched ${matched.length}/${total}${remainder ? ' — remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  renderMassTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
