import '../../styles/base.css';
import '../../styles/forms.css';
import './lungrads.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent, splitEditorContent } from '../../core/pill-editor.js';
import { lungradsDefinition } from './definition.js';
import { calculateLungrads } from './calculator.js';
import { lungradsTemplates } from './templates.js';
import { parseSegmentedFindings } from '../../core/parser.js';
import { getSizeUnit, setStored , trackEvent } from '../../core/storage.js';
import '../../core/tool-name.js';

let nodules = [createNoduleState(1)];
let activeNoduleIndex = 0;
let sizeUnit = getSizeUnit('lungrads');

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
  trackEvent('tool:lungrads:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const categoryDisplay = document.getElementById('lungrads-category');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const noduleTabsEl = document.getElementById('nodule-tabs');

  reportEl.toolId = lungradsDefinition.id;
  reportEl.definition = lungradsDefinition;
  reportEl.setTemplates(lungradsTemplates);

  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

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

  function buildUI() {
    const fs = nodules[activeNoduleIndex].formState;
    const def = lungradsDefinition;
    stepContainer.innerHTML = '';

    // Primary inputs
    const primaryCard = document.createElement('div');
    primaryCard.className = 'primary-inputs card';
    primaryCard.innerHTML = `
      <div class="primary-input-item input-group">
        <label for="input-location">Lobe</label>
        <select id="input-location">
          <option value="">Select lobe...</option>
          ${def.primaryInputs[0].options.map((o) =>
            `<option value="${o.id}" ${fs.location === o.id ? 'selected' : ''}>${o.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="primary-input-item input-group">
        <label for="input-size">Size (long axis)</label>
        <div class="input-with-unit">
          <input type="number" id="input-size" class="no-spinner" min="0.1" max="100" step="0.1" placeholder="${sizeUnit === 'mm' ? 'e.g., 6' : 'e.g., 0.6'}" value="${displaySize(fs.size) ?? ''}">
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
        setStored('sizeUnit:lungrads', sizeUnit);
        buildUI();
      });
    });
    primaryCard.querySelector('#input-series').addEventListener('input', (e) => { fs.seriesNumber = e.target.value.trim() || null; update(); });
    primaryCard.querySelector('#input-image').addEventListener('input', (e) => { fs.imageNumber = e.target.value.trim() || null; update(); });
    stepContainer.appendChild(primaryCard);

    // Nodule type
    stepContainer.appendChild(buildChoiceCard(def.noduleType, 'noduleType', fs));

    // Solid component size (only for part-solid)
    const solidCard = document.createElement('div');
    solidCard.className = 'step-card card';
    solidCard.id = 'solid-size-card';
    solidCard.innerHTML = `
      <div class="step-card__question">Solid Component Size</div>
      <div class="primary-inputs" style="margin-top: var(--space-xs);">
        <div class="primary-input-item input-group" style="max-width: 200px;">
          <input type="number" id="input-solid-size" class="no-spinner" min="0" max="100" step="0.1" placeholder="mm" value="${fs.solidSize ?? ''}">
        </div>
      </div>
    `;
    solidCard.querySelector('#input-solid-size').addEventListener('input', (e) => {
      fs.solidSize = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    stepContainer.appendChild(solidCard);

    // Prior comparison
    stepContainer.appendChild(buildChoiceCard(def.priorComparison, 'priorComparison', fs));

    // Suspicious features
    stepContainer.appendChild(buildChoiceCard(def.suspicious, 'suspicious', fs));

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
    const fs = nodules[activeNoduleIndex].formState;
    const solidCard = document.getElementById('solid-size-card');
    if (solidCard) solidCard.classList.toggle('step-card--disabled', fs.noduleType !== 'partSolid');
  }

  function update() {
    const fs = nodules[activeNoduleIndex].formState;
    const result = calculateLungrads(fs);
    categoryDisplay.textContent = result.categoryFullLabel;
    categoryDisplay.dataset.level = result.categoryLevel;
    updateReport();
  }

  function updateReport() {
    const allData = nodules.map((nod) => {
      const result = calculateLungrads(nod.formState);
      const data = { ...result };
      const refs = [];
      if (nod.formState.seriesNumber) refs.push(`Series ${nod.formState.seriesNumber}`);
      if (nod.formState.imageNumber) refs.push(`Image ${nod.formState.imageNumber}`);
      data.noduleLabel = refs.length > 0 ? `${nod.label} (${refs.join(', ')})` : nod.label;
      if (nod.formState.location) {
        const opt = lungradsDefinition.primaryInputs[0].options.find((o) => o.id === nod.formState.location);
        data.location = opt?.label || '';
        data.locationProvided = true;
      }
      return data;
    });

    const summaryLines = allData.map((d) => {
      const loc = d.locationProvided ? `${d.location} ` : '';
      const size = d.sizeProvided ? `${d.sizeMm} mm ` : '';
      return `${d.noduleLabel}: ${loc}${size}${d.noduleTypeLabel} nodule. ${d.categoryFullLabel}. ${d.management}`;
    });

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        const impData = { impressionSummary: summaryLines.join('\n') };
        if (nodules.length === 1) {
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
      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + (nodules.length === 1
        ? renderBlocks(blocks, allData[0], false)
        : allData.map((d) => renderBlocks(blocks, d, false)).join('\n\n')));
      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      if (studyAdditionalFindings.trim()) sections.push((headers.additionalFindings ?? 'ADDITIONAL FINDINGS:') + '\n' + studyAdditionalFindings.trim());
      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, { impressionSummary: summaryLines.join('\n') }));
      }
      return sections.join('\n\n');
    };
    reportEl.updateReport(allData[activeNoduleIndex]);
  }

  // Parse
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;

    // Item-indexed parsing: "Nodule 1: ... Nodule 2: ..." (or numbered
    // "1. ... 2. ...") pastes split into per-nodule segments, each
    // becoming its own tab. Single-nodule pastes fall through to the
    // ungrouped bucket and apply to the active tab (old behavior).
    const { segments, ungrouped, unmatchedSentences } = parseSegmentedFindings(text, lungradsDefinition);

    let matchedFieldCount = 0;

    if (segments.length > 0) {
      nodules = segments.map((seg) => ({
        id: seg.index,
        label: `Nodule ${seg.index}`,
        formState: { ...seg.formState },
      }));
      activeNoduleIndex = 0;
      matchedFieldCount = segments.reduce((n, s) => n + s.matched.length, 0);
    } else if (ungrouped.formState && Object.keys(ungrouped.formState).length > 0) {
      const fs = nodules[activeNoduleIndex].formState;
      for (const key of Object.keys(fs)) delete fs[key];
      Object.assign(fs, ungrouped.formState);
      matchedFieldCount = ungrouped.matched.length;
    }

    const additional = unmatchedSentences
      .filter((s) => !/^\s*(?:\(\d+\)|\d+\.?)\s*$/.test(s))
      .join(' ');
    additionalFindingsEl.value = additional;
    studyAdditionalFindings = additionalFindingsEl.value;

    renderNoduleTabs();
    buildUI();

    const noduleCount = segments.length > 0 ? segments.length : 1;
    const noduleSuffix = noduleCount > 1 ? ` across ${noduleCount} nodules` : '';
    parseStatus.textContent = `Matched ${matchedFieldCount} field(s)${noduleSuffix}${unmatchedSentences.length ? ' \u2014 remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  renderNoduleTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
