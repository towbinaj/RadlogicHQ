import '../../styles/base.css';
import '../../styles/forms.css';
import './fleischner.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent, splitEditorContent } from '../../core/pill-editor.js';
import { fleischnerDefinition } from './definition.js';
import { calculateFleischner } from './calculator.js';
import { fleischnerTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';
import { getSizeUnit, setStored , trackEvent } from '../../core/storage.js';

let nodules = [createNoduleState(1)];
let activeNoduleIndex = 0;
let sizeUnit = getSizeUnit('fleischner');

function createNoduleState(num) {
  return { id: num, label: `Nodule ${num}`, formState: {} };
}

function displaySize(sizeMm) {
  if (sizeMm == null || isNaN(sizeMm)) return '';
  return sizeUnit === 'cm' ? (sizeMm / 10).toFixed(1) : sizeMm;
}

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  trackEvent('tool:fleischner:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const recDisplay = document.getElementById('fleischner-rec');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const noduleTabsEl = document.getElementById('nodule-tabs');

  reportEl.toolId = fleischnerDefinition.id;
  reportEl.definition = fleischnerDefinition;
  reportEl.setTemplates(fleischnerTemplates);

  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  // --- Nodule tabs ---
  function renderNoduleTabs() {
    noduleTabsEl.innerHTML = '';
    nodules.forEach((nod, i) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${i === activeNoduleIndex ? 'active' : ''}`;
      tab.textContent = nod.label;
      tab.addEventListener('click', () => { activeNoduleIndex = i; renderNoduleTabs(); buildUI(); });
      tab.addEventListener('dblclick', () => {
        const n = prompt('Rename:', nod.label);
        if (n?.trim()) { nod.label = n.trim(); renderNoduleTabs(); updateReport(); }
      });
      noduleTabsEl.appendChild(tab);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'obs-tab obs-tab--add';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => {
      nodules.push(createNoduleState(nodules.length + 1));
      activeNoduleIndex = nodules.length - 1;
      renderNoduleTabs(); buildUI();
    });
    noduleTabsEl.appendChild(addBtn);
    if (nodules.length > 1) {
      const rmBtn = document.createElement('button');
      rmBtn.className = 'obs-tab obs-tab--remove';
      rmBtn.textContent = '\u2212';
      rmBtn.addEventListener('click', () => {
        nodules.splice(activeNoduleIndex, 1);
        if (activeNoduleIndex >= nodules.length) activeNoduleIndex = nodules.length - 1;
        renderNoduleTabs(); buildUI();
      });
      noduleTabsEl.appendChild(rmBtn);
    }
  }

  // --- Build UI ---
  function buildUI() {
    const fs = nodules[activeNoduleIndex].formState;
    stepContainer.innerHTML = '';

    // Block 1: Primary inputs (Lobe + Size)
    const primaryCard = document.createElement('div');
    primaryCard.className = 'primary-inputs card';
    primaryCard.innerHTML = `
      <div class="primary-input-item input-group">
        <label for="input-location">Lobe</label>
        <select id="input-location">
          <option value="">Select lobe...</option>
          ${fleischnerDefinition.primaryInputs[0].options.map((o) =>
            `<option value="${o.id}" ${fs.location === o.id ? 'selected' : ''}>${o.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="primary-input-item input-group">
        <label for="input-size">Size</label>
        <div class="input-with-unit">
          <input type="number" id="input-size" class="no-spinner" min="${sizeUnit === 'mm' ? '0.1' : '0.01'}" max="${sizeUnit === 'mm' ? '100' : '10'}" step="${sizeUnit === 'mm' ? '0.1' : '0.1'}" placeholder="${sizeUnit === 'mm' ? 'e.g., 5' : 'e.g., 0.5'}" value="${displaySize(fs.size) ?? ''}">
          <div class="unit-toggle">
            <button class="unit-toggle__btn ${sizeUnit === 'mm' ? 'active' : ''}" data-unit="mm">mm</button>
            <button class="unit-toggle__btn ${sizeUnit === 'cm' ? 'active' : ''}" data-unit="cm">cm</button>
          </div>
        </div>
      </div>
      <div class="primary-input-item primary-input-item--narrow input-group">
        <label for="input-series">Series</label>
        <input type="text" id="input-series" inputmode="numeric" placeholder="#" value="${fs.seriesNumber ?? ''}" class="no-spinner">
      </div>
      <div class="primary-input-item primary-input-item--narrow input-group">
        <label for="input-image">Image</label>
        <input type="text" id="input-image" inputmode="numeric" placeholder="#" value="${fs.imageNumber ?? ''}" class="no-spinner">
      </div>
    `;
    primaryCard.querySelector('#input-location').addEventListener('change', (e) => {
      fs.location = e.target.value || null; update();
    });
    primaryCard.querySelector('#input-size').addEventListener('input', (e) => {
      const raw = e.target.value !== '' ? parseFloat(e.target.value) : null;
      fs.size = raw != null ? (sizeUnit === 'cm' ? Math.round(raw * 100) / 10 : raw) : null;
      update();
    });
    primaryCard.querySelectorAll('.unit-toggle__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const newUnit = btn.dataset.unit;
        if (newUnit === sizeUnit) return;
        sizeUnit = newUnit;
        setStored('sizeUnit:fleischner', sizeUnit);
        buildUI();
      });
    });
    primaryCard.querySelector('#input-series').addEventListener('input', (e) => {
      fs.seriesNumber = e.target.value.trim() || null; update();
    });
    primaryCard.querySelector('#input-image').addEventListener('input', (e) => {
      fs.imageNumber = e.target.value.trim() || null; update();
    });
    stepContainer.appendChild(primaryCard);

    // Block 2: Nodule Type
    const def = fleischnerDefinition;
    const typeCard = document.createElement('div');
    typeCard.className = 'step-card card';
    typeCard.innerHTML = `
      <div class="step-card__question">Nodule Type</div>
      <div class="benign-choices">
        ${def.noduleType.options.map((o) => `
          <button class="benign-choice ${fs.noduleType === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}" ${o.tooltip ? `title="${esc(o.tooltip)}"` : ''}>${o.label}</button>
        `).join('')}
      </div>
    `;
    typeCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        fs.noduleType = btn.dataset.value;
        typeCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        updateRiskVisibility();
        update();
      });
    });
    stepContainer.appendChild(typeCard);

    // Block 3: Number (Single / Multiple)
    const countCard = document.createElement('div');
    countCard.className = 'step-card card';
    countCard.innerHTML = `
      <div class="step-card__question">Number</div>
      <div class="benign-choices">
        ${def.noduleCount.options.map((o) => `
          <button class="benign-choice ${fs.noduleCount === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}">${o.label}</button>
        `).join('')}
      </div>
    `;
    countCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        fs.noduleCount = btn.dataset.value;
        countCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(countCard);

    // Block 4: Risk Level (only needed for solid nodules <=8mm)
    const riskCard = document.createElement('div');
    riskCard.className = 'step-card card';
    riskCard.id = 'risk-card';
    riskCard.innerHTML = `
      <div class="step-card__question">
        Risk Level
        <span class="major-feature__label" title="${esc(def.riskLevel.tooltip)}" style="font-weight:400; font-size: var(--text-xs); margin-left: var(--space-xs); cursor: help;">(?)</span>
      </div>
      <div class="benign-choices">
        ${def.riskLevel.options.map((o) => `
          <button class="benign-choice ${fs.riskLevel === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}" ${o.tooltip ? `title="${esc(o.tooltip)}"` : ''}>${o.label}</button>
        `).join('')}
      </div>
    `;
    riskCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        fs.riskLevel = btn.dataset.value;
        riskCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(riskCard);

    updateRiskVisibility();
    update();
  }

  function updateRiskVisibility() {
    const fs = nodules[activeNoduleIndex].formState;
    const riskCard = document.getElementById('risk-card');
    if (!riskCard) return;

    // Risk is only relevant for solid nodules (and only affects <6mm and 6-8mm)
    // Show for solid, hide for subsolid
    const showRisk = fs.noduleType === 'solid';
    riskCard.classList.toggle('step-card--disabled', !showRisk);
  }

  // --- Update ---
  function update() {
    const fs = nodules[activeNoduleIndex].formState;
    const result = calculateFleischner(fs);
    recDisplay.textContent = result.recommendationFullLabel;
    recDisplay.dataset.level = result.recommendationLevel;
    updateReport();
  }

  function updateReport() {
    const allNoduleData = nodules.map((nod) => {
      const fs = { ...nod.formState };
      const result = calculateFleischner(fs);
      const data = { ...result };

      // Build nodule label with optional (Series #, Image #)
      const refs = [];
      if (fs.seriesNumber) refs.push(`Series ${fs.seriesNumber}`);
      if (fs.imageNumber) refs.push(`Image ${fs.imageNumber}`);
      data.noduleLabel = refs.length > 0
        ? `${nod.label} (${refs.join(', ')})`
        : nod.label;

      if (fs.location) {
        const opt = fleischnerDefinition.primaryInputs[0].options.find((o) => o.id === fs.location);
        data.location = opt?.label || '';
        data.locationProvided = true;
      } else { data.location = ''; data.locationProvided = false; }

      return data;
    });

    const summaryLines = allNoduleData.map((d) => {
      const loc = d.locationProvided ? `${d.location} ` : '';
      const size = d.sizeProvided ? `${d.sizeMm} mm ` : '';
      return `${d.noduleLabel}: ${loc}${size}${d.noduleTypeLabel} nodule. ${d.recommendationFullLabel}. ${d.management}`;
    });

    reportEl.renderFn = (config, _data) => {
      // Pill editor content path
      if (config.editorContent) {
        const impData = { impressionSummary: summaryLines.join('\n') };

        if (nodules.length === 1) {
          const merged = { ...allNoduleData[0], ...impData };
          let text = renderEditorContent(config.editorContent, config.pillStates, merged);
          if (studyAdditionalFindings.trim()) text += '\n\nADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim();
          return text;
        } else {
          const { findings, impression } = splitEditorContent(config.editorContent);
          const parts = allNoduleData.map((data) =>
            renderEditorContent(findings, config.pillStates, data)
          );
          let text = parts.join('\n\n');
          if (studyAdditionalFindings.trim()) text += '\n\nADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim();
          if (impression.length > 0) {
            text += '\n\n' + renderEditorContent(impression, config.pillStates, impData);
          }
          return text;
        }
      }

      // Fallback: block-based rendering
      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];

      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + (nodules.length === 1
        ? renderBlocks(blocks, allNoduleData[0], false)
        : allNoduleData.map((d) => renderBlocks(blocks, d, false)).join('\n\n')));

      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      if (studyAdditionalFindings.trim()) sections.push((headers.additionalFindings ?? 'ADDITIONAL FINDINGS:') + '\n' + studyAdditionalFindings.trim());
      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, { impressionSummary: summaryLines.join('\n') }));
      }

      return sections.join('\n\n');
    };
    reportEl.updateReport(allNoduleData[activeNoduleIndex]);
  }

  // --- Parse ---
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, fleischnerDefinition);
    const fs = nodules[activeNoduleIndex].formState;
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

  renderNoduleTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
