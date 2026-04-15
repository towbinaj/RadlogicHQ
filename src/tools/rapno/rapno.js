import '../../styles/base.css';
import '../../styles/forms.css';
import './rapno.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { rapnoDefinition, VARIANTS } from './definition.js';
import { calculateRapno } from './calculator.js';
import { rapnoTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseSegmentedFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

const MAX_TARGETS = 5;

function createTarget(num) {
  return { label: `Target ${num}`, location: '', blD1: null, blD2: null, curD1: null, curD2: null, nadirProduct: null };
}

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  trackEvent('tool:rapno:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeResponse = document.getElementById('badge-response');
  const badgePct = document.getElementById('badge-pct');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const modeTabsEl = document.getElementById('mode-tabs');

  let mode = localStorage.getItem('radtools:rapno:mode') || 'hgg';
  let targets = [createTarget(1)];
  const formState = { nonTarget: null, newLesion: null, clinicalStatus: null, steroids: null };
  let studyAdditionalFindings = '';

  reportEl.toolId = rapnoDefinition.id;
  reportEl.definition = rapnoDefinition;
  reportEl.setTemplates(rapnoTemplates);

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  // --- Mode tabs ---
  function renderModeTabs() {
    modeTabsEl.innerHTML = '';
    Object.values(VARIANTS).forEach((v) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${mode === v.id ? 'active' : ''}`;
      tab.textContent = v.label;
      tab.title = v.fullName;
      tab.addEventListener('click', () => {
        mode = v.id;
        localStorage.setItem('radtools:rapno:mode', mode);
        renderModeTabs();
        buildUI();
      });
      modeTabsEl.appendChild(tab);
    });
  }

  // --- Build UI ---
  function buildUI() {
    stepContainer.innerHTML = '';
    const variant = VARIANTS[mode];

    // === Target lesion table ===
    const tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.innerHTML = `
      <div class="step-card__question">Target Lesions (bidimensional)</div>
      <div style="overflow-x: auto;">
        <table class="rapno-table">
          <thead>
            <tr>
              <th>Lesion</th>
              <th>Location</th>
              <th colspan="3" style="text-align:center;">Baseline (mm)</th>
              <th colspan="3" style="text-align:center;">Current (mm)</th>
            </tr>
            <tr>
              <th></th>
              <th></th>
              <th>D1</th>
              <th>D2</th>
              <th>Product</th>
              <th>D1</th>
              <th>D2</th>
              <th>Product</th>
            </tr>
          </thead>
          <tbody id="target-rows">
            ${targets.map((t, i) => targetRow(t, i)).join('')}
          </tbody>
          <tfoot>
            <tr class="rapno-sum-row">
              <td colspan="4" style="text-align:right;">Sum of products:</td>
              <td class="rapno-prod" id="sum-bl">—</td>
              <td colspan="2"></td>
              <td class="rapno-prod" id="sum-cur">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="rapno-actions">
        <button class="btn" id="add-target" ${targets.length >= MAX_TARGETS ? 'disabled' : ''}>+ Add Target</button>
        ${targets.length > 1 ? '<button class="btn" id="remove-target">\u2212 Remove</button>' : ''}
      </div>
      <div class="rapno-sequence-note">Measure on: ${variant.sequence}</div>
    `;

    // Wire target inputs
    targets.forEach((t, i) => {
      const row = tableCard.querySelector(`[data-row="${i}"]`);
      if (!row) return;
      wireInput(row, '.rapno-loc', 'location', t, i);
      wireNumInput(row, '.rapno-bld1', 'blD1', t, i);
      wireNumInput(row, '.rapno-bld2', 'blD2', t, i);
      wireNumInput(row, '.rapno-curd1', 'curD1', t, i);
      wireNumInput(row, '.rapno-curd2', 'curD2', t, i);
    });

    // Add/remove targets
    tableCard.querySelector('#add-target')?.addEventListener('click', () => {
      if (targets.length < MAX_TARGETS) {
        targets.push(createTarget(targets.length + 1));
        buildUI();
      }
    });
    tableCard.querySelector('#remove-target')?.addEventListener('click', () => {
      if (targets.length > 1) {
        targets.pop();
        buildUI();
      }
    });

    stepContainer.appendChild(tableCard);

    // === Assessment inputs ===
    const assessCard = document.createElement('div');
    assessCard.className = 'card';
    assessCard.innerHTML = `
      <div class="step-card__question">Assessment</div>
      <div class="rapno-assess-grid">
        ${buildSelect('non-target', 'Non-target Disease', rapnoDefinition.nonTargetOptions, formState.nonTarget)}
        <div class="input-group">
          <label>New Lesions</label>
          <div class="toggle-group">
            ${rapnoDefinition.newLesionOptions.map((o) => `
              <button class="toggle-group__btn ${formState.newLesion === o.id ? 'toggle-group__btn--active' : ''}"
                data-value="${o.id}">${o.label}</button>
            `).join('')}
          </div>
        </div>
        ${buildSelect('clinical', 'Clinical Status', rapnoDefinition.clinicalStatusOptions, formState.clinicalStatus)}
        ${buildSelect('steroids', 'Steroids', rapnoDefinition.steroidOptions, formState.steroids)}
      </div>
    `;

    assessCard.querySelector('#sel-non-target').addEventListener('change', (e) => { formState.nonTarget = e.target.value || null; update(); });
    assessCard.querySelector('#sel-clinical').addEventListener('change', (e) => { formState.clinicalStatus = e.target.value || null; update(); });
    assessCard.querySelector('#sel-steroids').addEventListener('change', (e) => { formState.steroids = e.target.value || null; update(); });
    assessCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.newLesion = btn.dataset.value;
        assessCard.querySelectorAll('.toggle-group__btn').forEach((b) =>
          b.classList.toggle('toggle-group__btn--active', b === btn));
        update();
      });
    });

    stepContainer.appendChild(assessCard);
    update();
  }

  // --- Helpers ---
  // Dimension guards mirror calculator.js: baseline must be > 0 (a
  // 0-size baseline means "not yet measured"), but current accepts 0
  // so a disappeared lesion shows `0` in the Product column instead of
  // "—" and flips the badge to CR.
  function targetRow(t, i) {
    const blProd = (t.blD1 > 0 && t.blD2 > 0) ? Math.round(t.blD1 * t.blD2 * 10) / 10 : null;
    const curProd = (t.curD1 != null && t.curD2 != null && t.curD1 >= 0 && t.curD2 >= 0)
      ? Math.round(t.curD1 * t.curD2 * 10) / 10
      : null;
    return `
      <tr data-row="${i}">
        <td>${t.label}</td>
        <td><input type="text" class="rapno-loc no-spinner" value="${esc(t.location)}" placeholder="Location"></td>
        <td><input type="number" class="rapno-bld1 no-spinner" min="0" step="0.1" value="${t.blD1 ?? ''}" placeholder="D1"></td>
        <td><input type="number" class="rapno-bld2 no-spinner" min="0" step="0.1" value="${t.blD2 ?? ''}" placeholder="D2"></td>
        <td class="rapno-prod rapno-bl-prod">${blProd != null ? blProd : '—'}</td>
        <td><input type="number" class="rapno-curd1 no-spinner" min="0" step="0.1" value="${t.curD1 ?? ''}" placeholder="D1"></td>
        <td><input type="number" class="rapno-curd2 no-spinner" min="0" step="0.1" value="${t.curD2 ?? ''}" placeholder="D2"></td>
        <td class="rapno-prod rapno-cur-prod">${curProd != null ? curProd : '—'}</td>
      </tr>
    `;
  }

  function wireInput(row, selector, field, target) {
    const input = row.querySelector(selector);
    if (!input) return;
    input.addEventListener('input', (e) => { target[field] = e.target.value; update(); });
  }

  function wireNumInput(row, selector, field, target, i) {
    const input = row.querySelector(selector);
    if (!input) return;
    input.addEventListener('input', (e) => {
      target[field] = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshProducts(i);
      update();
    });
  }

  function refreshProducts(i) {
    const row = document.querySelector(`[data-row="${i}"]`);
    if (!row) return;
    const t = targets[i];
    const blProd = (t.blD1 > 0 && t.blD2 > 0) ? Math.round(t.blD1 * t.blD2 * 10) / 10 : null;
    const curProd = (t.curD1 != null && t.curD2 != null && t.curD1 >= 0 && t.curD2 >= 0)
      ? Math.round(t.curD1 * t.curD2 * 10) / 10
      : null;
    row.querySelector('.rapno-bl-prod').textContent = blProd != null ? blProd : '—';
    row.querySelector('.rapno-cur-prod').textContent = curProd != null ? curProd : '—';
    refreshSums();
  }

  function refreshSums() {
    let blSum = 0, curSum = 0, hasBl = false, hasCur = false;
    for (const t of targets) {
      if (t.blD1 > 0 && t.blD2 > 0) { blSum += t.blD1 * t.blD2; hasBl = true; }
      if (t.curD1 != null && t.curD2 != null && t.curD1 >= 0 && t.curD2 >= 0) {
        curSum += t.curD1 * t.curD2;
        hasCur = true;
      }
    }
    const sumBl = document.getElementById('sum-bl');
    const sumCur = document.getElementById('sum-cur');
    if (sumBl) sumBl.textContent = hasBl ? Math.round(blSum * 10) / 10 : '—';
    if (sumCur) sumCur.textContent = hasCur ? Math.round(curSum * 10) / 10 : '—';
  }

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

  // --- Update ---
  function update() {
    const variant = VARIANTS[mode];
    const result = calculateRapno(targets, formState, variant);

    badgeResponse.textContent = result.overallResponse;
    badgeResponse.dataset.level = result.overallResponseLevel;
    badgePct.textContent = result.pctLabel;

    updateReport();
  }

  function updateReport() {
    const variant = VARIANTS[mode];
    const data = calculateRapno(targets, formState, variant);

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
  const parseBtn = document.getElementById('parse-btn');
  const parseInput = document.getElementById('parse-input');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;

    // Item-indexed parsing: "Target 1: ... Target 2: ..." (or numbered
    // markers) split into per-target segments. RAPNO is bidimensional,
    // so each segment's `dimensions` field (if present) maps to
    // curD1/curD2; a fallback `size` field maps to curD1 only.
    // Baseline measurements stay manual -- they carry over from prior
    // reports.
    const { segments, ungrouped, unmatchedSentences } = parseSegmentedFindings(text, rapnoDefinition);

    // Helper: merge a parsed per-target formState into a target object.
    const applyToTarget = (t, parsedFs) => {
      if (parsedFs.location) t.location = parsedFs.location;
      if (parsedFs.dimensions) {
        t.curD1 = parsedFs.dimensions.d1;
        t.curD2 = parsedFs.dimensions.d2;
      } else if (parsedFs.size != null) {
        t.curD1 = parsedFs.size;
      }
    };

    let matchedFieldCount = 0;

    if (segments.length > 0) {
      targets = segments.slice(0, MAX_TARGETS).map((seg) => {
        const t = createTarget(seg.index);
        applyToTarget(t, seg.formState);
        return t;
      });
      matchedFieldCount = segments.reduce((n, s) => n + s.matched.length, 0);

      // Study-level fields (nonTarget, newLesion, clinicalStatus,
      // steroidDose) can appear anywhere -- pull from first source that
      // has them.
      for (const key of ['nonTarget', 'newLesion', 'clinicalStatus', 'steroidDose']) {
        for (const src of [...segments.map((s) => s.formState), ungrouped.formState]) {
          if (src && src[key]) { formState[key] = src[key]; break; }
        }
      }
    } else if (ungrouped.formState && Object.keys(ungrouped.formState).length > 0) {
      for (const key of ['nonTarget', 'newLesion', 'clinicalStatus', 'steroidDose']) {
        if (ungrouped.formState[key]) formState[key] = ungrouped.formState[key];
      }
      if (ungrouped.formState.dimensions || ungrouped.formState.size != null || ungrouped.formState.location) {
        applyToTarget(targets[0], ungrouped.formState);
      }
      matchedFieldCount = ungrouped.matched.length;
    }

    const additional = unmatchedSentences
      .filter((s) => !/^\s*(?:\(\d+\)|\d+\.?)\s*$/.test(s))
      .join(' ');
    additionalFindingsEl.value = additional;
    studyAdditionalFindings = additionalFindingsEl.value;

    buildUI();

    const targetCount = segments.length > 0 ? Math.min(segments.length, MAX_TARGETS) : 0;
    const targetSuffix = targetCount > 1 ? ` across ${targetCount} targets` : '';
    parseStatus.textContent = `Matched ${matchedFieldCount} field(s)${targetSuffix}${unmatchedSentences.length ? ' \u2014 remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  renderModeTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
