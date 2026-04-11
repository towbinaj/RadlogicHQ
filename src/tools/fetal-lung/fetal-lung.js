import '../../styles/base.css';
import '../../styles/forms.css';
import './fetal-lung.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { fetalLungDefinition } from './definition.js';
import { calculateFetalLung } from './calculator.js';
import { fetalLungTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:fetal-lung:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeOe = document.getElementById('badge-oe');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = fetalLungDefinition.id;
  reportEl.definition = fetalLungDefinition;
  reportEl.setTemplates(fetalLungTemplates);

  const formState = { ga: null, observedVolume: null, cdhSide: null, liverPosition: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = fetalLungDefinition;

    // GA + CDH info
    const metaCard = document.createElement('div');
    metaCard.className = 'card';
    metaCard.innerHTML = `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap; align-items:end;">
        <div class="input-group" style="max-width:140px;"><label for="ga-input">GA (weeks)</label><input type="number" id="ga-input" class="no-spinner" min="20" max="40" step="1" value="${formState.ga ?? ''}" placeholder="20\u201340"></div>
        <div class="input-group"><label>CDH Side</label><div class="toggle-group">${def.sideOptions.map((o) => `<button class="toggle-group__btn ${formState.cdhSide === o.id ? 'toggle-group__btn--active' : ''}" data-field="cdhSide" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>
        <div class="input-group"><label>Liver</label><div class="toggle-group">${def.liverOptions.map((o) => `<button class="toggle-group__btn ${formState.liverPosition === o.id ? 'toggle-group__btn--active' : ''}" data-field="liverPosition" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>
      </div>
    `;
    metaCard.querySelector('#ga-input').addEventListener('input', (e) => { formState.ga = e.target.value !== '' ? parseInt(e.target.value) : null; update(); });
    metaCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState[btn.dataset.field] = btn.dataset.value;
        metaCard.querySelectorAll(`.toggle-group__btn[data-field="${btn.dataset.field}"]`).forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(metaCard);

    // Volume input
    const volCard = document.createElement('div');
    volCard.className = 'card';
    volCard.innerHTML = `
      <div class="step-card__question">Lung Volume</div>
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap; align-items:end;">
        <div class="input-group" style="max-width:180px;"><label for="vol-input">Observed TFLV (mL)</label><input type="number" id="vol-input" class="no-spinner" min="0" step="0.1" value="${formState.observedVolume ?? ''}" placeholder="mL"></div>
        <div id="expected-display" style="font-size:var(--text-sm); color:var(--text-muted); padding-bottom:8px;"></div>
      </div>
      <div id="oe-display" style="font-weight:600; font-size:var(--text-lg); padding-top:var(--space-xs);"></div>
    `;
    volCard.querySelector('#vol-input').addEventListener('input', (e) => { formState.observedVolume = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    stepContainer.appendChild(volCard);

    // Reference table
    const refCard = document.createElement('div');
    refCard.className = 'card';
    refCard.innerHTML = `
      <div class="step-card__question">O/E TFLV Severity (CDH)</div>
      <table style="width:100%; font-size:var(--text-sm); border-collapse:collapse;">
        <thead><tr><th style="text-align:left; padding:4px;">O/E TFLV</th><th style="text-align:left; padding:4px;">Severity</th><th style="text-align:left; padding:4px;">Survival</th></tr></thead>
        <tbody>
          <tr style="border-top:1px solid var(--border);"><td style="padding:4px;">&lt;25%</td><td style="padding:4px;">Severe</td><td style="padding:4px;">~35\u201356%</td></tr>
          <tr style="border-top:1px solid var(--border);"><td style="padding:4px;">25\u201335%</td><td style="padding:4px;">Moderate</td><td style="padding:4px;">~56%</td></tr>
          <tr style="border-top:1px solid var(--border);"><td style="padding:4px;">&gt;35%</td><td style="padding:4px;">Mild</td><td style="padding:4px;">~90%</td></tr>
        </tbody>
      </table>
      <div style="font-size:var(--text-xs); color:var(--text-muted); margin-top:var(--space-xs);">Expected TFLV = 0.002 \u00d7 GA\u00b2\u00b7\u2079\u00b9\u00b3 (Rypens et al. 2001)</div>
    `;
    stepContainer.appendChild(refCard);

    update();
  }

  function update() {
    const r = calculateFetalLung(formState);
    badgeOe.textContent = r.oeLabel;
    badgeOe.dataset.level = r.level;

    const expDisp = document.getElementById('expected-display');
    const oeDisp = document.getElementById('oe-display');
    if (expDisp) expDisp.textContent = r.expectedProvided ? `Expected: ${r.expectedLabel}` : '';
    if (oeDisp) oeDisp.textContent = r.oeProvided ? `O/E TFLV: ${r.oeLabel} \u2014 ${r.severity}` : '';

    updateReport();
  }

  function updateReport() {
    const data = calculateFetalLung(formState);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, fetalLungDefinition);
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
