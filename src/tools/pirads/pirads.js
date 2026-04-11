import '../../styles/base.css';
import '../../styles/forms.css';
import './pirads.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent, splitEditorContent } from '../../core/pill-editor.js';
import { piradsDefinition } from './definition.js';
import { calculatePirads } from './calculator.js';
import { piradsTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';
import { getSizeUnit, setStored , trackEvent } from '../../core/storage.js';

let lesions = [createLesionState(1)];
let activeLesionIndex = 0;
let sizeUnit = getSizeUnit('pirads');

function createLesionState(num) {
  return { id: num, label: `Lesion ${num}`, formState: {} };
}

function displaySize(sizeMm) {
  if (sizeMm == null || isNaN(sizeMm)) return '';
  return sizeUnit === 'cm' ? (sizeMm / 10).toFixed(1) : sizeMm;
}

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  trackEvent('tool:pirads:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const categoryDisplay = document.getElementById('pirads-category');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const lesionTabsEl = document.getElementById('lesion-tabs');

  reportEl.toolId = piradsDefinition.id;
  reportEl.definition = piradsDefinition;
  reportEl.setTemplates(piradsTemplates);

  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function renderLesionTabs() {
    lesionTabsEl.innerHTML = '';
    lesions.forEach((les, i) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${i === activeLesionIndex ? 'active' : ''}`;
      tab.textContent = les.label;
      tab.addEventListener('click', () => { activeLesionIndex = i; renderLesionTabs(); buildUI(); });
      tab.addEventListener('dblclick', () => {
        const n = prompt('Rename:', les.label);
        if (n?.trim()) { les.label = n.trim(); renderLesionTabs(); updateReport(); }
      });
      lesionTabsEl.appendChild(tab);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'obs-tab obs-tab--add';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => {
      lesions.push(createLesionState(lesions.length + 1));
      activeLesionIndex = lesions.length - 1;
      renderLesionTabs(); buildUI();
    });
    lesionTabsEl.appendChild(addBtn);
    if (lesions.length > 1) {
      const rmBtn = document.createElement('button');
      rmBtn.className = 'obs-tab obs-tab--remove';
      rmBtn.textContent = '\u2212';
      rmBtn.addEventListener('click', () => {
        lesions.splice(activeLesionIndex, 1);
        if (activeLesionIndex >= lesions.length) activeLesionIndex = lesions.length - 1;
        renderLesionTabs(); buildUI();
      });
      lesionTabsEl.appendChild(rmBtn);
    }
  }

  function buildUI() {
    const fs = lesions[activeLesionIndex].formState;
    const def = piradsDefinition;
    stepContainer.innerHTML = '';

    // Primary inputs (Zone + Size)
    const primaryCard = document.createElement('div');
    primaryCard.className = 'primary-inputs card';
    primaryCard.innerHTML = `
      <div class="primary-input-item input-group">
        <label for="input-location">Zone / Location</label>
        <select id="input-location">
          <option value="">Select zone...</option>
          ${def.primaryInputs[0].options.map((o) =>
            `<option value="${o.id}" ${fs.location === o.id ? 'selected' : ''}>${o.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="primary-input-item input-group">
        <label for="input-size">Size</label>
        <div class="input-with-unit">
          <input type="number" id="input-size" class="no-spinner" min="${sizeUnit === 'mm' ? '0.1' : '0.01'}" max="${sizeUnit === 'mm' ? '100' : '10'}" step="0.1" placeholder="${sizeUnit === 'mm' ? 'e.g., 15' : 'e.g., 1.5'}" value="${displaySize(fs.size) ?? ''}">
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
        setStored('sizeUnit:pirads', sizeUnit);
        buildUI();
      });
    });
    primaryCard.querySelector('#input-series').addEventListener('input', (e) => { fs.seriesNumber = e.target.value.trim() || null; update(); });
    primaryCard.querySelector('#input-image').addEventListener('input', (e) => { fs.imageNumber = e.target.value.trim() || null; update(); });
    stepContainer.appendChild(primaryCard);

    // T2 score
    stepContainer.appendChild(buildScoreCard(def.t2Score, 't2Score', fs));

    // DWI score
    stepContainer.appendChild(buildScoreCard(def.dwiScore, 'dwiScore', fs));

    // DCE
    stepContainer.appendChild(buildChoiceCard(def.dce, 'dce', fs));

    // EPE
    stepContainer.appendChild(buildChoiceCard(def.epe, 'epe', fs));

    update();
  }

  function buildScoreCard(featureDef, key, fs) {
    const card = document.createElement('div');
    card.className = 'step-card card';
    card.innerHTML = `
      <div class="step-card__question">${featureDef.label}</div>
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
        update();
      });
    });
    return card;
  }

  function update() {
    const fs = lesions[activeLesionIndex].formState;
    const result = calculatePirads(fs);
    categoryDisplay.textContent = result.categoryFullLabel;
    categoryDisplay.dataset.level = result.categoryLevel;
    updateReport();
  }

  function updateReport() {
    const allData = lesions.map((les) => {
      const result = calculatePirads(les.formState);
      const data = { ...result };
      const refs = [];
      if (les.formState.seriesNumber) refs.push(`Series ${les.formState.seriesNumber}`);
      if (les.formState.imageNumber) refs.push(`Image ${les.formState.imageNumber}`);
      data.lesionLabel = refs.length > 0 ? `${les.label} (${refs.join(', ')})` : les.label;
      return data;
    });

    const summaryLines = allData.map((d) => {
      const loc = d.zoneProvided ? `${d.zoneLabel} ` : '';
      const size = d.sizeProvided ? `${d.sizeMm} mm ` : '';
      return `${d.lesionLabel}: ${loc}${size}${d.categoryFullLabel}. ${d.management}`;
    });

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        const impData = { impressionSummary: summaryLines.join('\n') };
        if (lesions.length === 1) {
          return renderEditorContent(config.editorContent, config.pillStates, { ...allData[0], ...impData });
        }
        const { findings, impression } = splitEditorContent(config.editorContent);
        let text = allData.map((d) => renderEditorContent(findings, config.pillStates, d)).join('\n\n');
        if (studyAdditionalFindings.trim()) text += '\n\nADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim();
        if (impression.length > 0) text += '\n\n' + renderEditorContent(impression, config.pillStates, impData);
        return text;
      }

      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];
      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + (lesions.length === 1
        ? renderBlocks(blocks, allData[0], false)
        : allData.map((d) => renderBlocks(blocks, d, false)).join('\n\n')));
      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      if (studyAdditionalFindings.trim()) sections.push((headers.additionalFindings ?? 'ADDITIONAL FINDINGS:') + '\n' + studyAdditionalFindings.trim());
      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, { impressionSummary: summaryLines.join('\n') }));
      }
      return sections.join('\n\n');
    };
    reportEl.updateReport(allData[activeLesionIndex]);
  }

  // Parse
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, piradsDefinition);
    const fs = lesions[activeLesionIndex].formState;
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

  renderLesionTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
