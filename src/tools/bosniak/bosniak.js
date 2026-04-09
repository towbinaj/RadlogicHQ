import '../../styles/base.css';
import '../../styles/forms.css';
import './bosniak.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent, splitEditorContent } from '../../core/pill-editor.js';
import { bosniakDefinition } from './definition.js';
import { calculateBosniak } from './calculator.js';
import { bosniakTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';

let cysts = [createCystState(1)];
let activeCystIndex = 0;
let sizeUnit = localStorage.getItem('radtools:sizeUnit:bosniak') || 'mm';

function createCystState(num) {
  return { id: num, label: `Cyst ${num}`, formState: {} };
}

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
  const classDisplay = document.getElementById('bosniak-class');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const cystTabsEl = document.getElementById('cyst-tabs');

  reportEl.toolId = bosniakDefinition.id;
  reportEl.definition = bosniakDefinition;
  reportEl.setTemplates(bosniakTemplates);

  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  // --- Cyst tabs ---
  function renderCystTabs() {
    cystTabsEl.innerHTML = '';
    cysts.forEach((cyst, i) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${i === activeCystIndex ? 'active' : ''}`;
      tab.textContent = cyst.label;
      tab.addEventListener('click', () => { activeCystIndex = i; renderCystTabs(); buildUI(); });
      tab.addEventListener('dblclick', () => {
        const n = prompt('Rename:', cyst.label);
        if (n?.trim()) { cyst.label = n.trim(); renderCystTabs(); updateReport(); }
      });
      cystTabsEl.appendChild(tab);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'obs-tab obs-tab--add';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => {
      cysts.push(createCystState(cysts.length + 1));
      activeCystIndex = cysts.length - 1;
      renderCystTabs(); buildUI();
    });
    cystTabsEl.appendChild(addBtn);
    if (cysts.length > 1) {
      const rmBtn = document.createElement('button');
      rmBtn.className = 'obs-tab obs-tab--remove';
      rmBtn.textContent = '\u2212';
      rmBtn.addEventListener('click', () => {
        cysts.splice(activeCystIndex, 1);
        if (activeCystIndex >= cysts.length) activeCystIndex = cysts.length - 1;
        renderCystTabs(); buildUI();
      });
      cystTabsEl.appendChild(rmBtn);
    }
  }

  // --- Build UI ---
  function buildUI() {
    const fs = cysts[activeCystIndex].formState;
    stepContainer.innerHTML = '';

    // Block 1: Primary inputs (Kidney + Size)
    const primaryCard = document.createElement('div');
    primaryCard.className = 'primary-inputs card';
    primaryCard.innerHTML = `
      <div class="primary-input-item input-group">
        <label for="input-location">Kidney</label>
        <select id="input-location">
          <option value="">Select location...</option>
          ${bosniakDefinition.primaryInputs[0].options.map((o) =>
            `<option value="${o.id}" ${fs.location === o.id ? 'selected' : ''}>${o.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="primary-input-item input-group">
        <label for="input-size">Size</label>
        <div class="input-with-unit">
          <input type="number" id="input-size" class="no-spinner" min="${sizeUnit === 'mm' ? '0.1' : '0.01'}" max="${sizeUnit === 'mm' ? '300' : '30'}" step="${sizeUnit === 'mm' ? '0.1' : '0.1'}" placeholder="${sizeUnit === 'mm' ? 'e.g., 25' : 'e.g., 2.5'}" value="${displaySize(fs.size) ?? ''}">
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
        localStorage.setItem('radtools:sizeUnit:bosniak', sizeUnit);
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

    // Block 2: Modality
    const def = bosniakDefinition;
    const modCard = document.createElement('div');
    modCard.className = 'step-card card';
    modCard.innerHTML = `
      <div class="step-card__question">Modality</div>
      <div class="benign-choices">
        ${def.modality.options.map((o) => `
          <button class="benign-choice ${fs.modality === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}">${o.label}</button>
        `).join('')}
      </div>
    `;
    modCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        fs.modality = btn.dataset.value;
        modCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(modCard);

    // Block 3: Wall
    const wallCard = buildChoiceCard('wall', def.wall, fs);
    stepContainer.appendChild(wallCard);

    // Block 4: Septa
    const septaCard = buildChoiceCard('septa', def.septa, fs);
    stepContainer.appendChild(septaCard);

    // Block 5: Enhancement
    const enhCard = buildChoiceCard('enhancement', def.enhancement, fs);
    stepContainer.appendChild(enhCard);

    // Block 6: Calcification
    const calcCard = buildChoiceCard('calcification', def.calcification, fs);
    stepContainer.appendChild(calcCard);

    // Block 7: Enhancing Soft Tissue
    const stCard = buildChoiceCard('softTissue', def.softTissue, fs);
    stepContainer.appendChild(stCard);

    update();
  }

  function buildChoiceCard(key, featureDef, fs) {
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
        update();
      });
    });
    return card;
  }

  // --- Update ---
  function update() {
    const fs = cysts[activeCystIndex].formState;
    const result = calculateBosniak(fs);
    classDisplay.textContent = result.categoryFullLabel;
    classDisplay.dataset.level = result.categoryLevel;
    updateReport();
  }

  function updateReport() {
    const allCystData = cysts.map((cyst) => {
      const fs = { ...cyst.formState };
      const result = calculateBosniak(fs);
      const data = { ...result };

      const refs = [];
      if (fs.seriesNumber) refs.push(`Series ${fs.seriesNumber}`);
      if (fs.imageNumber) refs.push(`Image ${fs.imageNumber}`);
      data.cystLabel = refs.length > 0
        ? `${cyst.label} (${refs.join(', ')})`
        : cyst.label;

      if (fs.location) {
        const opt = bosniakDefinition.primaryInputs[0].options.find((o) => o.id === fs.location);
        data.location = opt?.label || '';
        data.locationProvided = true;
      } else { data.location = ''; data.locationProvided = false; }

      return data;
    });

    const summaryLines = allCystData.map((d) => {
      const loc = d.locationProvided ? `${d.location} ` : '';
      const size = d.sizeProvided ? `${d.sizeMm} mm ` : '';
      return `${d.cystLabel}: ${loc}${size}cystic renal mass. ${d.categoryFullLabel}. ${d.management}`;
    });

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        const impData = { impressionSummary: summaryLines.join('\n') };

        if (cysts.length === 1) {
          const merged = { ...allCystData[0], ...impData };
          let text = renderEditorContent(config.editorContent, config.pillStates, merged);
          if (studyAdditionalFindings.trim()) text += '\n\nADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim();
          return text;
        } else {
          const { findings, impression } = splitEditorContent(config.editorContent);
          const parts = allCystData.map((data) =>
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

      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];

      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + (cysts.length === 1
        ? renderBlocks(blocks, allCystData[0], false)
        : allCystData.map((d) => renderBlocks(blocks, d, false)).join('\n\n')));

      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      if (studyAdditionalFindings.trim()) sections.push((headers.additionalFindings ?? 'ADDITIONAL FINDINGS:') + '\n' + studyAdditionalFindings.trim());
      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, { impressionSummary: summaryLines.join('\n') }));
      }

      return sections.join('\n\n');
    };
    reportEl.updateReport(allCystData[activeCystIndex]);
  }

  // --- Parse ---
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, bosniakDefinition);
    const fs = cysts[activeCystIndex].formState;
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

  renderCystTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
