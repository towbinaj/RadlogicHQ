import '../../styles/base.css';
import '../../styles/forms.css';
import './mrecist.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { mrecistDefinition } from './definition.js';
import { calculateMrecist } from './calculator.js';
import { mrecistTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseSegmentedFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

const MAX_TARGETS = 5;

function createTarget(n) { return { label: `Target ${n}`, location: '', baseline: null, current: null, nadir: null }; }
function esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

function init() {
  trackEvent('tool:mrecist:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeResponse = document.getElementById('badge-response');
  const badgePct = document.getElementById('badge-pct');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = mrecistDefinition.id;
  reportEl.definition = mrecistDefinition;
  reportEl.setTemplates(mrecistTemplates);

  let targets = [createTarget(1)];
  const formState = { nonTarget: null, newLesion: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Target table — enhancing diameters
    const tableCard = document.createElement('div');
    tableCard.className = 'card recist-table-card';
    tableCard.innerHTML = `
      <div class="step-card__question">Target Lesions — Enhancing Diameter (mm)</div>
      <table class="recist-table">
        <thead><tr><th>Lesion</th><th>Location</th><th>Baseline</th><th>Current</th><th>Nadir</th></tr></thead>
        <tbody>${targets.map((t, i) => `
          <tr data-row="${i}">
            <td class="recist-table__label">${t.label}</td>
            <td><input type="text" value="${esc(t.location)}" class="t-loc" style="width:80px;"></td>
            <td><input type="number" class="no-spinner t-bl" min="0" step="0.1" value="${t.baseline ?? ''}" style="width:60px;"></td>
            <td><input type="number" class="no-spinner t-cur" min="0" step="0.1" value="${t.current ?? ''}" style="width:60px;"></td>
            <td><input type="number" class="no-spinner t-nad" min="0" step="0.1" value="${t.nadir ?? ''}" style="width:60px;" placeholder="auto"></td>
          </tr>
        `).join('')}</tbody>
        <tfoot><tr><td colspan="2" style="text-align:right; font-weight:600;">Sum:</td><td id="sum-bl" style="font-weight:600;">—</td><td id="sum-cur" style="font-weight:600;">—</td><td></td></tr></tfoot>
      </table>
      <div style="display:flex; gap:var(--space-xs); margin-top:var(--space-xs);">
        <button class="btn" id="add-target" ${targets.length >= MAX_TARGETS ? 'disabled' : ''}>+ Add</button>
        ${targets.length > 1 ? '<button class="btn" id="rm-target">\u2212 Remove</button>' : ''}
      </div>
      <div style="font-size:var(--text-xs); color:var(--text-muted); margin-top:var(--space-xs);">Measure longest enhancing (viable) diameter on arterial phase</div>
    `;

    targets.forEach((t, i) => {
      const row = tableCard.querySelector(`[data-row="${i}"]`);
      row.querySelector('.t-loc').addEventListener('input', (e) => { t.location = e.target.value; update(); });
      row.querySelector('.t-bl').addEventListener('input', (e) => { t.baseline = e.target.value !== '' ? parseFloat(e.target.value) : null; refreshSums(); update(); });
      row.querySelector('.t-cur').addEventListener('input', (e) => { t.current = e.target.value !== '' ? parseFloat(e.target.value) : null; refreshSums(); update(); });
      row.querySelector('.t-nad').addEventListener('input', (e) => { t.nadir = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    });

    tableCard.querySelector('#add-target')?.addEventListener('click', () => { if (targets.length < MAX_TARGETS) { targets.push(createTarget(targets.length + 1)); buildUI(); } });
    tableCard.querySelector('#rm-target')?.addEventListener('click', () => { if (targets.length > 1) { targets.pop(); buildUI(); } });
    stepContainer.appendChild(tableCard);

    // Assessment
    const assessCard = document.createElement('div');
    assessCard.className = 'card';
    assessCard.innerHTML = `
      <div class="step-card__question">Assessment</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-sm);">
        <div class="input-group"><label for="sel-nt">Non-target Disease</label><select id="sel-nt"><option value="">—</option>${mrecistDefinition.nonTargetOptions.map((o) => `<option value="${o.id}">${o.label}</option>`).join('')}</select></div>
        <div class="input-group"><label>New Lesions</label><div class="toggle-group">${mrecistDefinition.newLesionOptions.map((o) => `<button class="toggle-group__btn ${formState.newLesion === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>
      </div>
    `;
    assessCard.querySelector('#sel-nt').addEventListener('change', (e) => { formState.nonTarget = e.target.value || null; update(); });
    assessCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.newLesion = btn.dataset.value;
        assessCard.querySelectorAll('.toggle-group__btn').forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(assessCard);

    refreshSums();
    update();
  }

  function refreshSums() {
    let bl = 0, cur = 0, hBl = false, hCur = false;
    for (const t of targets) { if (t.baseline > 0) { bl += t.baseline; hBl = true; } if (t.current != null && t.current >= 0) { cur += t.current; hCur = true; } }
    const sBl = document.getElementById('sum-bl'); const sCur = document.getElementById('sum-cur');
    if (sBl) sBl.textContent = hBl ? Math.round(bl * 10) / 10 : '—';
    if (sCur) sCur.textContent = hCur ? Math.round(cur * 10) / 10 : '—';
  }

  function update() {
    const result = calculateMrecist(formState, targets);
    badgeResponse.textContent = result.overallResponse;
    badgeResponse.dataset.level = result.overallResponseLevel;
    badgePct.textContent = result.pctLabel;
    updateReport();
  }

  function updateReport() {
    const data = calculateMrecist(formState, targets);
    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) { let text = renderEditorContent(config.editorContent, config.pillStates, data); if (studyAdditionalFindings.trim()) text += '\n\n' + (config.sectionHeaders?.additionalFindings ?? 'Other findings:') + '\n' + studyAdditionalFindings.trim(); return text; }
      const blocks = config.blocks || []; const headers = config.sectionHeaders || {}; const sections = [];
      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + renderBlocks(blocks, data, false));
      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      sections.push((headers.additionalFindings ?? 'Other findings:') + '\n' + (studyAdditionalFindings.trim() || 'None.'));
      if (config.impression?.enabled && config.impression?.template) sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, data));
      return sections.join('\n\n');
    };
    reportEl.updateReport(data);
  }

  const parseBtn = document.getElementById('parse-btn');
  const parseInput = document.getElementById('parse-input');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;

    // Item-indexed parsing: "Target 1: ... Target 2: ..." (or numbered
    // markers) split into per-target segments. Each segment populates
    // one target row's location + current enhancing diameter.
    // Baseline/nadir carry over from prior reports and stay manual.
    const { segments, ungrouped, unmatchedSentences } = parseSegmentedFindings(text, mrecistDefinition);

    let matchedFieldCount = 0;

    if (segments.length > 0) {
      targets = segments.slice(0, MAX_TARGETS).map((seg) => ({
        label: `Target ${seg.index}`,
        location: seg.formState.location || '',
        baseline: null,
        current: seg.formState.size != null ? seg.formState.size : null,
        nadir: null,
      }));
      matchedFieldCount = segments.reduce((n, s) => n + s.matched.length, 0);

      // Study-level fields: pull from wherever they appear.
      for (const key of ['nonTarget', 'newLesion']) {
        for (const src of [...segments.map((s) => s.formState), ungrouped.formState]) {
          if (src && src[key]) { formState[key] = src[key]; break; }
        }
      }
    } else if (ungrouped.formState && Object.keys(ungrouped.formState).length > 0) {
      for (const key of ['nonTarget', 'newLesion']) {
        if (ungrouped.formState[key]) formState[key] = ungrouped.formState[key];
      }
      if (ungrouped.formState.size != null || ungrouped.formState.location) {
        targets[0] = {
          label: targets[0]?.label || 'Target 1',
          location: ungrouped.formState.location || targets[0]?.location || '',
          baseline: targets[0]?.baseline ?? null,
          current: ungrouped.formState.size != null ? ungrouped.formState.size : (targets[0]?.current ?? null),
          nadir: targets[0]?.nadir ?? null,
        };
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
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
