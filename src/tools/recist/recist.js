import '../../styles/base.css';
import '../../styles/forms.css';
import './recist.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { recistDefinition } from './definition.js';
import { calculateRecist } from './calculator.js';
import { recistTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';

const MAX_TARGETS = 5;

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const responseDisplay = document.getElementById('recist-response');
  const pctDisplay = document.getElementById('recist-pct');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = recistDefinition.id;
  reportEl.definition = recistDefinition;
  reportEl.setTemplates(recistTemplates);

  const formState = {};
  let targets = [createTarget(1)];
  let studyAdditionalFindings = '';

  function createTarget(num) {
    return { label: `Target ${num}`, organ: '', baseline: null, current: null, nadir: null };
  }

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Block 1: Target lesion table
    const tableCard = document.createElement('div');
    tableCard.className = 'card recist-table-card';
    tableCard.innerHTML = `
      <div class="step-card__question">Target Lesions (max 5, max 2 per organ)</div>
      <table class="recist-table">
        <thead>
          <tr>
            <th>Lesion</th>
            <th>Organ</th>
            <th>Baseline (mm)</th>
            <th>Current (mm)</th>
            <th>Nadir (mm)</th>
          </tr>
        </thead>
        <tbody id="target-rows">
          ${targets.map((t, i) => `
            <tr>
              <td class="recist-table__label">${t.label}</td>
              <td><input type="text" class="recist-table__input recist-table__input--wide" data-idx="${i}" data-field="organ" placeholder="e.g., Liver" value="${t.organ}"></td>
              <td><input type="number" class="no-spinner recist-table__input" data-idx="${i}" data-field="baseline" min="0" step="0.1" placeholder="mm" value="${t.baseline ?? ''}"></td>
              <td><input type="number" class="no-spinner recist-table__input" data-idx="${i}" data-field="current" min="0" step="0.1" placeholder="mm" value="${t.current ?? ''}"></td>
              <td><input type="number" class="no-spinner recist-table__input" data-idx="${i}" data-field="nadir" min="0" step="0.1" placeholder="mm" value="${t.nadir ?? ''}"></td>
            </tr>
          `).join('')}
          <tr class="recist-table__sum-row">
            <td class="recist-table__label" colspan="2">Sum</td>
            <td class="recist-table__computed" id="sum-baseline">—</td>
            <td class="recist-table__computed" id="sum-current">—</td>
            <td class="recist-table__computed" id="sum-nadir">—</td>
          </tr>
        </tbody>
      </table>
      <div class="recist-table-actions">
        <button class="btn" id="add-target" ${targets.length >= MAX_TARGETS ? 'disabled' : ''}>+ Add Target</button>
        <button class="btn" id="remove-target" ${targets.length <= 1 ? 'disabled' : ''}>− Remove</button>
      </div>
    `;

    // Wire inputs
    tableCard.querySelectorAll('.recist-table__input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const field = e.target.dataset.field;
        if (field === 'organ') {
          targets[idx].organ = e.target.value;
        } else {
          targets[idx][field] = e.target.value !== '' ? parseFloat(e.target.value) : null;
        }
        refreshSums(tableCard);
        update();
      });
    });

    tableCard.querySelector('#add-target').addEventListener('click', () => {
      if (targets.length < MAX_TARGETS) {
        targets.push(createTarget(targets.length + 1));
        buildUI();
      }
    });
    tableCard.querySelector('#remove-target').addEventListener('click', () => {
      if (targets.length > 1) {
        targets.pop();
        buildUI();
      }
    });

    stepContainer.appendChild(tableCard);
    refreshSums(tableCard);

    // Block 2: Non-target lesions
    const ntCard = document.createElement('div');
    ntCard.className = 'step-card card';
    ntCard.innerHTML = `
      <div class="step-card__question">Non-Target Lesions</div>
      <div class="benign-choices">
        ${recistDefinition.nonTargetOptions.map((o) => `
          <button class="benign-choice ${formState.nonTarget === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}" ${o.tooltip ? `title="${o.tooltip.replace(/"/g, '&quot;')}"` : ''}>${o.label}</button>
        `).join('')}
      </div>
    `;
    ntCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.nonTarget = btn.dataset.value;
        ntCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(ntCard);

    // Block 3: New lesions
    const nlCard = document.createElement('div');
    nlCard.className = 'step-card card';
    nlCard.innerHTML = `
      <div class="step-card__question">New Lesions</div>
      <div class="benign-choices">
        ${recistDefinition.newLesionOptions.map((o) => `
          <button class="benign-choice ${formState.newLesion === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}" ${o.tooltip ? `title="${o.tooltip.replace(/"/g, '&quot;')}"` : ''}>${o.label}</button>
        `).join('')}
      </div>
    `;
    nlCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.newLesion = btn.dataset.value;
        nlCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(nlCard);

    update();
  }

  function refreshSums(card) {
    let bSum = 0, cSum = 0, nSum = 0;
    let hasB = false, hasC = false, hasN = false;
    for (const t of targets) {
      if (t.baseline != null && t.baseline > 0) { bSum += t.baseline; hasB = true; }
      if (t.current != null && t.current >= 0) { cSum += t.current; hasC = true; }
      if (t.nadir != null && t.nadir >= 0) { nSum += t.nadir; hasN = true; }
    }
    const bEl = card.querySelector('#sum-baseline');
    const cEl = card.querySelector('#sum-current');
    const nEl = card.querySelector('#sum-nadir');
    if (bEl) bEl.textContent = hasB ? Math.round(bSum * 10) / 10 : '—';
    if (cEl) cEl.textContent = hasC ? Math.round(cSum * 10) / 10 : '—';
    if (nEl) nEl.textContent = hasN ? Math.round(nSum * 10) / 10 : '—';
  }

  function update() {
    const result = calculateRecist(formState, targets);

    responseDisplay.textContent = result.overallResponseFullLabel;
    responseDisplay.dataset.level = result.overallResponseLevel;

    pctDisplay.textContent = result.pctFromBaselineLabel;
    if (result.pctFromBaseline != null) {
      if (result.pctFromBaseline <= -30) pctDisplay.style.color = 'var(--success)';
      else if (result.pctFromBaseline >= 20) pctDisplay.style.color = 'var(--danger)';
      else pctDisplay.style.color = 'var(--text-primary)';
    } else {
      pctDisplay.style.color = '';
    }

    updateReport();
  }

  function updateReport() {
    const result = calculateRecist(formState, targets);
    const data = { ...result };

    // Build per-target text summary
    const targetLines = targets
      .filter((t) => t.baseline != null || t.current != null)
      .map((t) => {
        const parts = [t.label];
        if (t.organ) parts[0] += ` (${t.organ})`;
        if (t.baseline != null) parts.push(`Baseline: ${t.baseline} mm`);
        if (t.current != null) parts.push(`Current: ${t.current} mm`);
        if (t.nadir != null) parts.push(`Nadir: ${t.nadir} mm`);
        return parts.join(', ');
      });
    data.targetSummaryText = targetLines.length > 0
      ? 'Target lesions:\n' + targetLines.join('\n')
      : 'No target lesions measured';

    const impressionSummary = `RECIST 1.1: ${result.overallResponseFullLabel}. Sum of target lesion diameters: ${result.baselineSum ?? '?'} mm → ${result.currentSum ?? '?'} mm (${result.pctFromBaselineLabel} from baseline).`;

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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, recistDefinition);
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
