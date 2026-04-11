import '../../styles/base.css';
import '../../styles/forms.css';
import './scoliosis.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { scoliosisDefinition, VERTEBRAE } from './definition.js';
import { calculateScoliosis } from './calculator.js';
import { scoliosisTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';

function createCurveState(num) {
  return { id: num, label: `Curve ${num}`, direction: null, region: null, angle: null, upperVertebra: null, lowerVertebra: null, apex: null };
}

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  trackEvent('tool:scoliosis:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeAngle = document.getElementById('badge-angle');
  const badgeRisser = document.getElementById('badge-risser');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const curveTabsEl = document.getElementById('curve-tabs');

  reportEl.toolId = scoliosisDefinition.id;
  reportEl.definition = scoliosisDefinition;
  reportEl.setTemplates(scoliosisTemplates);

  let curves = [createCurveState(1)];
  let activeCurveIndex = 0;
  let studyAdditionalFindings = '';

  const formState = {
    hardware: 'none',
    hardwareDetail: '',
    scoliosisType: null,
    kyphosis: null,
    pelvicObliquity: 'none',
    pelvicObliquityDetail: '',
    vertebralAbnormalities: 'none',
    vertebralDetail: '',
    ribAbnormalities: 'none',
    ribDetail: '',
    triradiate: null,
    risser: null,
    priorMeasurements: '',
    chestAbdomen: 'Normal.',
  };

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  // --- Curve tabs ---
  function renderCurveTabs() {
    curveTabsEl.innerHTML = '';
    if (curves.length <= 1 && !curves[0].direction && !curves[0].angle) {
      // Single empty curve — hide tabs
      curveTabsEl.style.display = 'none';
      return;
    }
    curveTabsEl.style.display = '';
    curves.forEach((c, i) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${i === activeCurveIndex ? 'active' : ''}`;
      tab.textContent = c.label;
      tab.addEventListener('click', () => { activeCurveIndex = i; renderCurveTabs(); buildUI(); });
      tab.addEventListener('dblclick', () => {
        const n = prompt('Rename:', c.label);
        if (n?.trim()) { c.label = n.trim(); renderCurveTabs(); updateReport(); }
      });
      curveTabsEl.appendChild(tab);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'obs-tab obs-tab--add';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => {
      curves.push(createCurveState(curves.length + 1));
      activeCurveIndex = curves.length - 1;
      renderCurveTabs(); buildUI();
    });
    curveTabsEl.appendChild(addBtn);
    if (curves.length > 1) {
      const rmBtn = document.createElement('button');
      rmBtn.className = 'obs-tab obs-tab--remove';
      rmBtn.textContent = '\u2212';
      rmBtn.addEventListener('click', () => {
        curves.splice(activeCurveIndex, 1);
        if (activeCurveIndex >= curves.length) activeCurveIndex = curves.length - 1;
        renderCurveTabs(); buildUI();
      });
      curveTabsEl.appendChild(rmBtn);
    }
  }

  // --- Build UI ---
  function buildUI() {
    stepContainer.innerHTML = '';
    const def = scoliosisDefinition;
    const curve = curves[activeCurveIndex];

    // === Curve measurement card ===
    const curveCard = document.createElement('div');
    curveCard.className = 'card scol-curve-card';
    curveCard.innerHTML = `
      <div class="step-card__question">Curve Measurement</div>
      <div class="scol-row">
        <div class="input-group">
          <label>Direction</label>
          <div class="toggle-group">
            ${def.curveDirectionOptions.map((o) => `
              <button class="toggle-group__btn ${curve.direction === o.id ? 'toggle-group__btn--active' : ''}"
                data-value="${o.id}">${o.label}</button>
            `).join('')}
          </div>
        </div>
        <div class="input-group">
          <label for="curve-region">Region</label>
          <select id="curve-region">
            <option value="">—</option>
            ${def.curveRegionOptions.map((o) => `
              <option value="${o.id}" ${curve.region === o.id ? 'selected' : ''}>${o.label}</option>
            `).join('')}
          </select>
        </div>
        <div class="input-group input-group--narrow">
          <label for="curve-angle">Cobb °</label>
          <input type="number" id="curve-angle" class="no-spinner" min="0" max="180" step="0.1" value="${curve.angle ?? ''}" placeholder="°">
        </div>
      </div>
      <div class="scol-row">
        <div class="input-group">
          <label for="curve-upper">Upper</label>
          <select id="curve-upper">
            <option value="">—</option>
            ${VERTEBRAE.map((v) => `<option value="${v}" ${curve.upperVertebra === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label for="curve-lower">Lower</label>
          <select id="curve-lower">
            <option value="">—</option>
            ${VERTEBRAE.map((v) => `<option value="${v}" ${curve.lowerVertebra === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label for="curve-apex">Apex</label>
          <select id="curve-apex">
            <option value="">—</option>
            ${VERTEBRAE.map((v) => `<option value="${v}" ${curve.apex === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    // Direction toggles
    curveCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        curve.direction = btn.dataset.value;
        curveCard.querySelectorAll('.toggle-group__btn').forEach((b) =>
          b.classList.toggle('toggle-group__btn--active', b === btn));
        renderCurveTabs();
        update();
      });
    });
    curveCard.querySelector('#curve-region').addEventListener('change', (e) => { curve.region = e.target.value || null; update(); });
    curveCard.querySelector('#curve-angle').addEventListener('input', (e) => { curve.angle = e.target.value !== '' ? parseFloat(e.target.value) : null; renderCurveTabs(); update(); });
    curveCard.querySelector('#curve-upper').addEventListener('change', (e) => { curve.upperVertebra = e.target.value || null; update(); });
    curveCard.querySelector('#curve-lower').addEventListener('change', (e) => { curve.lowerVertebra = e.target.value || null; update(); });
    curveCard.querySelector('#curve-apex').addEventListener('change', (e) => { curve.apex = e.target.value || null; update(); });

    stepContainer.appendChild(curveCard);

    // === Add curve button (when tabs hidden) ===
    if (curves.length === 1) {
      const addRow = document.createElement('div');
      addRow.style.cssText = 'margin-bottom: var(--space-sm);';
      addRow.innerHTML = `<button class="btn" id="add-curve-btn">+ Add Curve</button>`;
      addRow.querySelector('#add-curve-btn').addEventListener('click', () => {
        curves.push(createCurveState(curves.length + 1));
        activeCurveIndex = curves.length - 1;
        renderCurveTabs(); buildUI();
      });
      stepContainer.appendChild(addRow);
    }

    // === Prior measurements ===
    const priorCard = document.createElement('div');
    priorCard.className = 'card';
    priorCard.innerHTML = `
      <div class="input-group">
        <label for="prior-measurements">Prior Measurements</label>
        <input type="text" id="prior-measurements" value="${esc(formState.priorMeasurements)}" placeholder="e.g. 12/2024: 18 degrees, 6/2024: 15 degrees">
      </div>
    `;
    priorCard.querySelector('#prior-measurements').addEventListener('input', (e) => { formState.priorMeasurements = e.target.value; update(); });
    stepContainer.appendChild(priorCard);

    // === Associated findings ===
    const findingsCard = document.createElement('div');
    findingsCard.className = 'card';
    findingsCard.innerHTML = `
      <div class="step-card__question">Associated Findings</div>
      <div class="scol-findings-grid">
        ${buildSelect('hardware', 'Spinal Hardware', def.hardwareOptions, formState.hardware)}
        ${buildSelect('scoliosis-type', 'Scoliosis Type', def.scoliosisTypeOptions, formState.scoliosisType)}
        ${buildSelect('kyphosis', 'Kyphosis/Lordosis', def.kyphosisOptions, formState.kyphosis)}
        ${buildSelect('pelvic-obliquity', 'Pelvic Obliquity', def.pelvicObliquityOptions, formState.pelvicObliquity)}
        ${buildSelect('vertebral', 'Vertebral Abnormalities', def.vertebralAbnormalityOptions, formState.vertebralAbnormalities)}
        ${buildSelect('rib', 'Rib Abnormalities', def.ribAbnormalityOptions, formState.ribAbnormalities)}
      </div>
      <div id="detail-inputs"></div>
    `;

    // Wire selects
    findingsCard.querySelector('#sel-hardware').addEventListener('change', (e) => { formState.hardware = e.target.value || 'none'; rebuildDetails(); update(); });
    findingsCard.querySelector('#sel-scoliosis-type').addEventListener('change', (e) => { formState.scoliosisType = e.target.value || null; update(); });
    findingsCard.querySelector('#sel-kyphosis').addEventListener('change', (e) => { formState.kyphosis = e.target.value || null; update(); });
    findingsCard.querySelector('#sel-pelvic-obliquity').addEventListener('change', (e) => { formState.pelvicObliquity = e.target.value || 'none'; rebuildDetails(); update(); });
    findingsCard.querySelector('#sel-vertebral').addEventListener('change', (e) => { formState.vertebralAbnormalities = e.target.value || 'none'; rebuildDetails(); update(); });
    findingsCard.querySelector('#sel-rib').addEventListener('change', (e) => { formState.ribAbnormalities = e.target.value || 'none'; rebuildDetails(); update(); });

    stepContainer.appendChild(findingsCard);

    // Conditional detail text inputs
    const detailContainer = findingsCard.querySelector('#detail-inputs');
    function rebuildDetails() {
      detailContainer.innerHTML = '';
      if (formState.hardware === 'present') {
        detailContainer.appendChild(makeDetailInput('hardware-detail', 'Hardware details', formState.hardwareDetail, (v) => { formState.hardwareDetail = v; update(); }));
      }
      if (formState.pelvicObliquity === 'present') {
        detailContainer.appendChild(makeDetailInput('pelvic-detail', 'Pelvic obliquity details', formState.pelvicObliquityDetail, (v) => { formState.pelvicObliquityDetail = v; update(); }));
      }
      if (formState.vertebralAbnormalities === 'present') {
        detailContainer.appendChild(makeDetailInput('vertebral-detail', 'Vertebral abnormality details', formState.vertebralDetail, (v) => { formState.vertebralDetail = v; update(); }));
      }
      if (formState.ribAbnormalities === 'present') {
        detailContainer.appendChild(makeDetailInput('rib-detail', 'Rib abnormality details', formState.ribDetail, (v) => { formState.ribDetail = v; update(); }));
      }
    }
    rebuildDetails();

    // === Skeletal maturity ===
    const maturityCard = document.createElement('div');
    maturityCard.className = 'card';
    maturityCard.innerHTML = `
      <div class="step-card__question">Skeletal Maturity</div>
      <div class="scol-findings-grid">
        ${buildSelect('triradiate', 'Triradiate Cartilage', def.triradiateOptions, formState.triradiate)}
        <div class="input-group">
          <label>Risser Stage</label>
          <div class="scol-risser-row">
            ${[0, 1, 2, 3, 4, 5].map((n) => `
              <button class="benign-choice ${formState.risser === n ? 'benign-choice--active' : ''}"
                data-risser="${n}">${n}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    maturityCard.querySelector('#sel-triradiate').addEventListener('change', (e) => { formState.triradiate = e.target.value || null; update(); });
    maturityCard.querySelectorAll('[data-risser]').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.risser = parseInt(btn.dataset.risser);
        maturityCard.querySelectorAll('[data-risser]').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(maturityCard);

    // === Chest & abdomen ===
    const chestCard = document.createElement('div');
    chestCard.className = 'card';
    chestCard.innerHTML = `
      <div class="input-group">
        <label for="chest-abdomen">Imaged Portions of Chest & Abdomen</label>
        <input type="text" id="chest-abdomen" value="${esc(formState.chestAbdomen)}" placeholder="Normal.">
      </div>
    `;
    chestCard.querySelector('#chest-abdomen').addEventListener('input', (e) => { formState.chestAbdomen = e.target.value; update(); });
    stepContainer.appendChild(chestCard);

    update();
  }

  // --- Helpers ---
  function buildSelect(id, label, options, selected) {
    return `
      <div class="input-group">
        <label for="sel-${id}">${label}</label>
        <select id="sel-${id}">
          <option value="">—</option>
          ${options.map((o) => `<option value="${o.id}" ${selected === o.id ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>
      </div>
    `;
  }

  function makeDetailInput(id, placeholder, value, onChange) {
    const div = document.createElement('div');
    div.className = 'input-group scol-detail-input';
    div.innerHTML = `<input type="text" id="${id}" value="${esc(value)}" placeholder="${placeholder}">`;
    div.querySelector('input').addEventListener('input', (e) => onChange(e.target.value));
    return div;
  }

  // --- Update ---
  function update() {
    const data = calculateScoliosis({ ...formState, curves });
    badgeAngle.textContent = data.primaryAngle != null ? `${data.primaryAngle}°` : '--';
    badgeRisser.textContent = data.risserLabel || '--';
    updateReport();
  }

  function updateReport() {
    const data = calculateScoliosis({ ...formState, curves });

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        let text = renderEditorContent(config.editorContent, config.pillStates, data);
        if (studyAdditionalFindings.trim()) {
          text += '\n\n' + (config.sectionHeaders?.additionalFindings ?? 'Other findings:') + '\n' + studyAdditionalFindings.trim();
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
    // Simple regex-based parse for scoliosis reports
    const parsed = parseScoliosisReport(text);
    Object.assign(formState, parsed.formState);
    if (parsed.curves.length > 0) {
      curves = parsed.curves;
      activeCurveIndex = 0;
    }
    additionalFindingsEl.value = parsed.remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;
    renderCurveTabs();
    buildUI();
    parseStatus.textContent = `Parsed ${parsed.fieldsMatched} fields`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  renderCurveTabs();
  buildUI();
}

/**
 * Simple parser for scoliosis report text.
 */
function parseScoliosisReport(text) {
  const fs = {};
  let fieldsMatched = 0;
  const curvesParsed = [];

  // Hardware
  const hwMatch = text.match(/SPINAL HARDWARE:\s*(.+)/i);
  if (hwMatch) {
    const val = hwMatch[1].trim().replace(/\.$/, '');
    fs.hardware = val.toLowerCase() === 'none' ? 'none' : 'present';
    if (fs.hardware === 'present') fs.hardwareDetail = hwMatch[1].trim();
    fieldsMatched++;
  }

  // Curves
  const curvePattern = /(dextro|levo)scoliosis\s+of\s+the\s+(\w+)\s+spine\s+measuring\s+([\d.]+)\s+degrees?\s*(?:\(([A-Z]\d+)-([A-Z]\d+)\))?/gi;
  let m;
  let curveNum = 1;
  while ((m = curvePattern.exec(text)) !== null) {
    curvesParsed.push({
      id: curveNum,
      label: `Curve ${curveNum}`,
      direction: m[1].toLowerCase() === 'dextro' ? 'dextro' : 'levo',
      region: m[2].toLowerCase(),
      angle: parseFloat(m[3]),
      upperVertebra: m[4] || null,
      lowerVertebra: m[5] || null,
      apex: null,
    });
    curveNum++;
    fieldsMatched++;
  }

  // Scoliosis type
  const typeMatch = text.match(/SCOLIOSIS TYPE:\s*(.+)/i);
  if (typeMatch) {
    const val = typeMatch[1].trim().replace(/\.$/, '').toLowerCase();
    const typeMap = { 'n/a': 'na', 'idiopathic': 'idiopathic', 'congenital': 'congenital', 'infantile': 'infantile', 'neuromuscular': 'neuromuscular', 'syndrome related': 'syndrome', 'unknown': 'unknown' };
    fs.scoliosisType = typeMap[val] || null;
    fieldsMatched++;
  }

  // Kyphosis
  const kyphMatch = text.match(/KYPHOSIS\/LORDOSIS:\s*(.+)/i);
  if (kyphMatch) {
    const val = kyphMatch[1].trim().replace(/\.$/, '').toLowerCase();
    const kyphMap = { 'normal': 'normal', 'n/a': 'na', 'increased': 'increased', 'decreased': 'decreased' };
    fs.kyphosis = kyphMap[val] || null;
    fieldsMatched++;
  }

  // Triradiate
  const triMatch = text.match(/TRIRADIATE CARTILAGE:\s*(.+)/i);
  if (triMatch) {
    const val = triMatch[1].trim().replace(/\.$/, '').toLowerCase();
    const triMap = { 'open': 'open', 'closing': 'closing', 'closed': 'closed', 'not visualized': 'not-visualized' };
    fs.triradiate = triMap[val] || null;
    fieldsMatched++;
  }

  // Risser
  const risserMatch = text.match(/RISSER STAGE:\s*(\d)/i);
  if (risserMatch) {
    fs.risser = parseInt(risserMatch[1]);
    fieldsMatched++;
  }

  // Prior measurements
  const priorMatch = text.match(/PRIOR MEASUREMENT\(S\):\s*(.+)/i);
  if (priorMatch) {
    const val = priorMatch[1].trim();
    if (val && val !== '[]' && val.toLowerCase() !== 'none') {
      fs.priorMeasurements = val;
      fieldsMatched++;
    }
  }

  // Pelvic obliquity
  const pelvicMatch = text.match(/PELVIC OBLIQUITY:\s*(.+)/i);
  if (pelvicMatch) {
    const val = pelvicMatch[1].trim().replace(/\.$/, '');
    fs.pelvicObliquity = val.toLowerCase() === 'none' ? 'none' : 'present';
    if (fs.pelvicObliquity === 'present') fs.pelvicObliquityDetail = pelvicMatch[1].trim();
    fieldsMatched++;
  }

  // Vertebral abnormalities
  const vertMatch = text.match(/VERTEBRAL ABNORMALITIES:\s*(.+)/i);
  if (vertMatch) {
    const val = vertMatch[1].trim().replace(/\.$/, '');
    fs.vertebralAbnormalities = val.toLowerCase() === 'none' ? 'none' : 'present';
    if (fs.vertebralAbnormalities === 'present') fs.vertebralDetail = vertMatch[1].trim();
    fieldsMatched++;
  }

  // Rib abnormalities
  const ribMatch = text.match(/RIB ABNORMALITIES:\s*(.+)/i);
  if (ribMatch) {
    const val = ribMatch[1].trim().replace(/\.$/, '');
    fs.ribAbnormalities = val.toLowerCase() === 'none' ? 'none' : 'present';
    if (fs.ribAbnormalities === 'present') fs.ribDetail = ribMatch[1].trim();
    fieldsMatched++;
  }

  // Chest/abdomen
  const chestMatch = text.match(/IMAGED PORTIONS OF THE CHEST AND ABDOMEN:\s*(.+)/i);
  if (chestMatch) {
    fs.chestAbdomen = chestMatch[1].trim();
    fieldsMatched++;
  }

  return { formState: fs, curves: curvesParsed, fieldsMatched, remainder: '' };
}

document.addEventListener('DOMContentLoaded', init);
