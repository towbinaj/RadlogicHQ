import '../../styles/base.css';
import '../../styles/forms.css';
import './fetal-pf.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { fetalPFDefinition } from './definition.js';
import { calculateFetalPF } from './calculator.js';
import { fetalPFTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:fetal-pf:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeTva = document.getElementById('badge-tva');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = fetalPFDefinition.id;
  reportEl.definition = fetalPFDefinition;
  reportEl.setTemplates(fetalPFTemplates);

  const formState = { ga: null, vermianHeight: null, vermianAP: null, tva: null, brainstemAP: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    // GA
    const gaCard = document.createElement('div');
    gaCard.className = 'card';
    gaCard.innerHTML = `<div class="input-group" style="max-width:160px;"><label for="ga-input">Gestational Age (weeks)</label><input type="number" id="ga-input" class="no-spinner" min="17" max="40" step="1" value="${formState.ga ?? ''}" placeholder="17\u201340"></div>`;
    gaCard.querySelector('#ga-input').addEventListener('input', (e) => { formState.ga = e.target.value !== '' ? parseInt(e.target.value) : null; update(); });
    stepContainer.appendChild(gaCard);

    // Measurements
    const measCard = document.createElement('div');
    measCard.className = 'card';
    measCard.innerHTML = `
      <div class="step-card__question">Posterior Fossa Measurements (mm / \u00b0)</div>
      <div style="display:grid; grid-template-columns:1fr auto; gap:var(--space-sm); align-items:end;">
        <div class="input-group"><label for="vh-input">Vermian height (CC)</label><input type="number" id="vh-input" class="no-spinner" min="0" step="0.1" value="${formState.vermianHeight ?? ''}" placeholder="mm"></div>
        <div id="vh-ref" style="font-size:var(--text-xs); color:var(--text-muted); padding-bottom:8px;"></div>
        <div class="input-group"><label for="vap-input">Vermian AP diameter</label><input type="number" id="vap-input" class="no-spinner" min="0" step="0.1" value="${formState.vermianAP ?? ''}" placeholder="mm"></div>
        <div></div>
        <div class="input-group"><label for="tva-input">Tegmento-vermian angle (TVA)</label><input type="number" id="tva-input" class="no-spinner" min="0" max="180" step="0.1" value="${formState.tva ?? ''}" placeholder="\u00b0"></div>
        <div id="tva-ref" style="font-size:var(--text-xs); color:var(--text-muted); padding-bottom:8px;">Normal <18\u00b0</div>
        <div class="input-group"><label for="bs-input">Brainstem AP diameter</label><input type="number" id="bs-input" class="no-spinner" min="0" step="0.1" value="${formState.brainstemAP ?? ''}" placeholder="mm"></div>
        <div></div>
      </div>
    `;
    measCard.querySelector('#vh-input').addEventListener('input', (e) => { formState.vermianHeight = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    measCard.querySelector('#vap-input').addEventListener('input', (e) => { formState.vermianAP = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    measCard.querySelector('#tva-input').addEventListener('input', (e) => { formState.tva = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    measCard.querySelector('#bs-input').addEventListener('input', (e) => { formState.brainstemAP = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    stepContainer.appendChild(measCard);

    // TVA reference
    const refCard = document.createElement('div');
    refCard.className = 'card';
    refCard.innerHTML = `
      <div class="step-card__question">TVA Classification (GA-independent)</div>
      <table style="width:100%; font-size:var(--text-sm); border-collapse:collapse;">
        <thead><tr><th style="text-align:left; padding:4px;">TVA</th><th style="text-align:left; padding:4px;">Category</th><th style="text-align:left; padding:4px;">Differential</th></tr></thead>
        <tbody>
          <tr style="border-top:1px solid var(--border);"><td style="padding:4px;">&lt;18\u00b0</td><td style="padding:4px;">Normal</td><td style="padding:4px;">\u2014</td></tr>
          <tr style="border-top:1px solid var(--border);"><td style="padding:4px;">18\u201330\u00b0</td><td style="padding:4px;">Mildly elevated</td><td style="padding:4px;">Blake pouch remnant</td></tr>
          <tr style="border-top:1px solid var(--border);"><td style="padding:4px;">30\u201370\u00b0</td><td style="padding:4px;">Moderately elevated</td><td style="padding:4px;">Vermian hypoplasia</td></tr>
          <tr style="border-top:1px solid var(--border);"><td style="padding:4px;">&gt;70\u00b0</td><td style="padding:4px;">Severely elevated</td><td style="padding:4px;">Dandy-Walker spectrum</td></tr>
        </tbody>
      </table>
    `;
    stepContainer.appendChild(refCard);

    update();
  }

  function update() {
    const r = calculateFetalPF(formState);
    badgeTva.textContent = r.tvaLabel;
    badgeTva.dataset.level = r.level;

    const vhRef = document.getElementById('vh-ref');
    const tvaRef = document.getElementById('tva-ref');
    if (vhRef) vhRef.textContent = r.vhExpectedProvided ? `Expected: ${r.vhExpected} (${r.vhInterpretation || '\u2014'})` : '';
    if (tvaRef) tvaRef.textContent = r.tvaCategoryProvided ? r.tvaCategoryDesc : 'Normal <18\u00b0';

    updateReport();
  }

  function updateReport() {
    const data = calculateFetalPF(formState);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, fetalPFDefinition);
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
