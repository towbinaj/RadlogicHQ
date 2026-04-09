import '../../styles/base.css';
import '../../styles/forms.css';
import './leglength.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { leglengthDefinition } from './definition.js';
import { calculateLegLength, calculateSegmental } from './calculator.js';
import { leglengthTemplates, segmentalTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';

let mode = localStorage.getItem('radtools:leglength:mode') || 'total';
const totalState = {};
const segmentalState = {};

function pad(val) {
  return val != null ? val : '';
}

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const discDisplay = document.getElementById('ll-discrepancy');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const modeTabsEl = document.getElementById('mode-tabs');

  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  // --- Mode tabs ---
  function renderModeTabs() {
    modeTabsEl.innerHTML = '';
    const modes = [
      { id: 'total', label: 'Total' },
      { id: 'segmental', label: 'Segmental' },
    ];
    modes.forEach((m) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${mode === m.id ? 'active' : ''}`;
      tab.textContent = m.label;
      tab.addEventListener('click', () => {
        mode = m.id;
        localStorage.setItem('radtools:leglength:mode', mode);
        applyTemplates();
        renderModeTabs();
        buildUI();
      });
      modeTabsEl.appendChild(tab);
    });
  }

  function applyTemplates() {
    const tpl = mode === 'segmental' ? segmentalTemplates : leglengthTemplates;
    // Use different toolId per mode so saved block configs don't collide
    reportEl.toolId = mode === 'segmental' ? 'leglength-seg' : 'leglength';
    reportEl.renderFn = null;
    reportEl.setTemplates(tpl);
  }

  reportEl.toolId = leglengthDefinition.id;
  reportEl.definition = leglengthDefinition;
  applyTemplates();

  // ===== TOTAL MODE =====
  function buildTotalUI() {
    stepContainer.innerHTML = '';
    const def = leglengthDefinition;
    const fs = totalState;

    // Measurements
    const measureCard = document.createElement('div');
    measureCard.className = 'primary-inputs card';
    measureCard.innerHTML = `
      <div class="primary-input-item input-group">
        <label for="input-right-length">Right Leg (cm)</label>
        <input type="number" id="input-right-length" class="no-spinner" min="0.1" max="200" step="0.1" placeholder="e.g., 78.5" value="${pad(fs.rightLength)}">
      </div>
      <div class="primary-input-item input-group">
        <label for="input-left-length">Left Leg (cm)</label>
        <input type="number" id="input-left-length" class="no-spinner" min="0.1" max="200" step="0.1" placeholder="e.g., 79.2" value="${pad(fs.leftLength)}">
      </div>
    `;
    measureCard.querySelector('#input-right-length').addEventListener('input', (e) => {
      fs.rightLength = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    measureCard.querySelector('#input-left-length').addEventListener('input', (e) => {
      fs.leftLength = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    stepContainer.appendChild(measureCard);

    // Right alignment
    stepContainer.appendChild(buildChoiceCard('Right Knee Alignment', def.alignmentOptions, 'rightAlignment', fs));

    // Left alignment
    stepContainer.appendChild(buildChoiceCard('Left Knee Alignment', def.alignmentOptions, 'leftAlignment', fs));

    // Physes
    stepContainer.appendChild(buildChoiceCard('Physes', def.physesOptions, 'physes', fs));

    update();
  }

  // ===== SEGMENTAL MODE =====
  function buildSegmentalUI() {
    stepContainer.innerHTML = '';
    const fs = segmentalState;

    // Segmental measurement table
    const tableCard = document.createElement('div');
    tableCard.className = 'card ll-segment-card';

    const rightTotal = (fs.rightFemur > 0 && fs.rightTibia > 0) ? Math.round((fs.rightFemur + fs.rightTibia) * 10) / 10 : null;
    const leftTotal = (fs.leftFemur > 0 && fs.leftTibia > 0) ? Math.round((fs.leftFemur + fs.leftTibia) * 10) / 10 : null;
    const femurDiff = (fs.rightFemur > 0 && fs.leftFemur > 0) ? Math.round(Math.abs(fs.rightFemur - fs.leftFemur) * 10) / 10 : null;
    const tibiaDiff = (fs.rightTibia > 0 && fs.leftTibia > 0) ? Math.round(Math.abs(fs.rightTibia - fs.leftTibia) * 10) / 10 : null;
    const totalDiff = (rightTotal != null && leftTotal != null) ? Math.round(Math.abs(rightTotal - leftTotal) * 10) / 10 : null;

    tableCard.innerHTML = `
      <table class="ll-table">
        <thead>
          <tr>
            <th></th>
            <th>Right (cm)</th>
            <th>Left (cm)</th>
            <th>Difference (cm)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="ll-table__label">Femur</td>
            <td><input type="number" id="input-right-femur" class="no-spinner ll-table__input" min="0.1" max="100" step="0.1" placeholder="—" value="${pad(fs.rightFemur)}"></td>
            <td><input type="number" id="input-left-femur" class="no-spinner ll-table__input" min="0.1" max="100" step="0.1" placeholder="—" value="${pad(fs.leftFemur)}"></td>
            <td class="ll-table__computed" id="cell-femur-diff">${femurDiff != null ? femurDiff : '—'}</td>
          </tr>
          <tr>
            <td class="ll-table__label">Tibia</td>
            <td><input type="number" id="input-right-tibia" class="no-spinner ll-table__input" min="0.1" max="100" step="0.1" placeholder="—" value="${pad(fs.rightTibia)}"></td>
            <td><input type="number" id="input-left-tibia" class="no-spinner ll-table__input" min="0.1" max="100" step="0.1" placeholder="—" value="${pad(fs.leftTibia)}"></td>
            <td class="ll-table__computed" id="cell-tibia-diff">${tibiaDiff != null ? tibiaDiff : '—'}</td>
          </tr>
          <tr class="ll-table__total-row">
            <td class="ll-table__label">Total</td>
            <td class="ll-table__computed" id="cell-right-total">${rightTotal != null ? rightTotal : '—'}</td>
            <td class="ll-table__computed" id="cell-left-total">${leftTotal != null ? leftTotal : '—'}</td>
            <td class="ll-table__computed ll-table__computed--bold" id="cell-total-diff">${totalDiff != null ? totalDiff : '—'}</td>
          </tr>
        </tbody>
      </table>
    `;

    const femurDiffCell = tableCard.querySelector('#cell-femur-diff');
    const tibiaDiffCell = tableCard.querySelector('#cell-tibia-diff');
    const rightTotalCell = tableCard.querySelector('#cell-right-total');
    const leftTotalCell = tableCard.querySelector('#cell-left-total');
    const totalDiffCell = tableCard.querySelector('#cell-total-diff');

    function refreshComputed() {
      const rF = fs.rightFemur > 0 ? fs.rightFemur : null;
      const lF = fs.leftFemur > 0 ? fs.leftFemur : null;
      const rT = fs.rightTibia > 0 ? fs.rightTibia : null;
      const lT = fs.leftTibia > 0 ? fs.leftTibia : null;
      const rTot = (rF && rT) ? Math.round((rF + rT) * 10) / 10 : null;
      const lTot = (lF && lT) ? Math.round((lF + lT) * 10) / 10 : null;
      const fD = (rF && lF) ? Math.round(Math.abs(rF - lF) * 10) / 10 : null;
      const tD = (rT && lT) ? Math.round(Math.abs(rT - lT) * 10) / 10 : null;
      const totD = (rTot != null && lTot != null) ? Math.round(Math.abs(rTot - lTot) * 10) / 10 : null;

      femurDiffCell.textContent = fD != null ? fD : '—';
      tibiaDiffCell.textContent = tD != null ? tD : '—';
      rightTotalCell.textContent = rTot != null ? rTot : '—';
      leftTotalCell.textContent = lTot != null ? lTot : '—';
      totalDiffCell.textContent = totD != null ? totD : '—';
    }

    tableCard.querySelector('#input-right-femur').addEventListener('input', (e) => {
      fs.rightFemur = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshComputed(); update();
    });
    tableCard.querySelector('#input-left-femur').addEventListener('input', (e) => {
      fs.leftFemur = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshComputed(); update();
    });
    tableCard.querySelector('#input-right-tibia').addEventListener('input', (e) => {
      fs.rightTibia = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshComputed(); update();
    });
    tableCard.querySelector('#input-left-tibia').addEventListener('input', (e) => {
      fs.leftTibia = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshComputed(); update();
    });

    stepContainer.appendChild(tableCard);

    // Alignment + Physes (shared with total mode)
    const def = leglengthDefinition;
    stepContainer.appendChild(buildChoiceCard('Right Knee Alignment', def.alignmentOptions, 'rightAlignment', fs));
    stepContainer.appendChild(buildChoiceCard('Left Knee Alignment', def.alignmentOptions, 'leftAlignment', fs));
    stepContainer.appendChild(buildChoiceCard('Physes', def.physesOptions, 'physes', fs));

    update();
  }

  // ===== Shared helpers =====
  function buildChoiceCard(title, options, key, fs) {
    const card = document.createElement('div');
    card.className = 'step-card card';
    card.innerHTML = `
      <div class="step-card__question">${title}</div>
      <div class="benign-choices">
        ${options.map((o) => `
          <button class="benign-choice ${fs[key] === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}">${o.label}</button>
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

  function buildUI() {
    if (mode === 'segmental') {
      buildSegmentalUI();
    } else {
      buildTotalUI();
    }
  }

  // ===== Update =====
  function update() {
    if (mode === 'total') {
      const result = calculateLegLength(totalState);
      if (result.bothProvided && result.discrepancy != null) {
        discDisplay.textContent = result.longerSide === 'equal' ? 'Equal' : `${result.discrepancy} cm`;
      } else {
        discDisplay.textContent = '--';
      }
    } else {
      const result = calculateSegmental(segmentalState);
      if (result.bothTotal && result.discrepancy != null) {
        discDisplay.textContent = result.longerSide === 'equal' ? 'Equal' : `${result.discrepancy} cm`;
      } else {
        discDisplay.textContent = '--';
      }
    }
    updateReport();
  }

  function updateReport() {
    if (mode === 'total') {
      updateTotalReport();
    } else {
      updateSegmentalReport();
    }
  }

  function updateTotalReport() {
    const result = calculateLegLength(totalState);
    const data = { ...result };

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

  function updateSegmentalReport() {
    const result = calculateSegmental(segmentalState);

    // Build the measurement table as plain text
    const dash = '—';
    const rFemur = result.rightFemur != null ? result.rightFemur : dash;
    const lFemur = result.leftFemur != null ? result.leftFemur : dash;
    const fDiff = result.femurDiff != null ? result.femurDiff : dash;
    const rTibia = result.rightTibia != null ? result.rightTibia : dash;
    const lTibia = result.leftTibia != null ? result.leftTibia : dash;
    const tDiff = result.tibiaDiff != null ? result.tibiaDiff : dash;
    const rTotal = result.rightTotal != null ? result.rightTotal : dash;
    const lTotal = result.leftTotal != null ? result.leftTotal : dash;
    const totDiff = result.totalDiff != null ? result.totalDiff : dash;

    // Pad columns for alignment
    function col(val, width) {
      const s = String(val);
      return s + ' '.repeat(Math.max(0, width - s.length));
    }

    const table = [
      `             Right (cm)    Left (cm)     Difference (cm)`,
      `Femur        ${col(rFemur, 13)}${col(lFemur, 14)}${fDiff}`,
      `Tibia        ${col(rTibia, 13)}${col(lTibia, 14)}${tDiff}`,
      `Total        ${col(rTotal, 13)}${col(lTotal, 14)}${totDiff}`,
    ].join('\n');

    const data = {
      ...result,
      measurementTable: table,
      hasAnySegment: result.rightFemur != null || result.leftFemur != null || result.rightTibia != null || result.leftTibia != null,
    };

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        let text = renderEditorContent(config.editorContent, config.pillStates, data);
        if (studyAdditionalFindings.trim()) {
          text += '\n\n' + (config.sectionHeaders?.additionalFindings ?? 'Other findings:') + '\n' + studyAdditionalFindings.trim();
        }
        return text;
      }

      const headers = config.sectionHeaders || {};
      const sections = [];

      // For segmental, render the table directly then add alignment/physes
      const findingsLines = ['The following measurements were obtained:\n', table];
      if (data.rightAlignmentProvided) findingsLines.push(`\nThere is ${data.rightAlignmentLabel} alignment of the RIGHT lower extremity at the knee.`);
      if (data.leftAlignmentProvided) findingsLines.push(`There is ${data.leftAlignmentLabel} alignment of the LEFT lower extremity at the knee.`);
      if (data.physesProvided) findingsLines.push(`The physes are ${data.physesLabel}.`);
      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + findingsLines.join('\n'));

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
    const fs = mode === 'total' ? totalState : segmentalState;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, leglengthDefinition);
    for (const key of Object.keys(fs)) delete fs[key];
    Object.assign(fs, parsed);
    additionalFindingsEl.value = remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;
    buildUI();
    const total = matched.length + unmatched.length;
    parseStatus.textContent = `Matched ${matched.length}/${total}${remainder ? ' — remainder in Other Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  renderModeTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
