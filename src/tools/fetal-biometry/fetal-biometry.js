import '../../styles/base.css';
import '../../styles/forms.css';
import './fetal-biometry.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { fetalBiometryDefinition } from './definition.js';
import { calculateFetalBiometry } from './calculator.js';
import { fetalBiometryTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:fetal-biometry:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeBpd = document.getElementById('badge-bpd');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = fetalBiometryDefinition.id;
  reportEl.definition = fetalBiometryDefinition;
  reportEl.setTemplates(fetalBiometryTemplates);

  const formState = { ga: null, bpd: null, cerebellum: null, cisternaMagna: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    // GA input
    const gaCard = document.createElement('div');
    gaCard.className = 'card';
    gaCard.innerHTML = `<div class="input-group" style="max-width:160px;"><label for="ga-input">Gestational Age (weeks)</label><input type="number" id="ga-input" class="no-spinner" min="20" max="40" step="1" value="${formState.ga ?? ''}" placeholder="20\u201340"></div>`;
    gaCard.querySelector('#ga-input').addEventListener('input', (e) => { formState.ga = e.target.value !== '' ? parseInt(e.target.value) : null; update(); });
    stepContainer.appendChild(gaCard);

    // Measurements
    const measCard = document.createElement('div');
    measCard.className = 'card';
    measCard.innerHTML = `
      <div class="step-card__question">Measurements (mm)</div>
      <div style="display:grid; grid-template-columns:1fr 1fr auto; gap:var(--space-sm); align-items:end;">
        <div class="input-group"><label for="bpd-input">BPD</label><input type="number" id="bpd-input" class="no-spinner" min="0" step="0.1" value="${formState.bpd ?? ''}" placeholder="mm"></div>
        <div id="bpd-ref" style="font-size:var(--text-xs); color:var(--text-muted); padding-bottom:8px;"></div>
        <div></div>
        <div class="input-group"><label for="cereb-input">Cerebellar diameter</label><input type="number" id="cereb-input" class="no-spinner" min="0" step="0.1" value="${formState.cerebellum ?? ''}" placeholder="mm"></div>
        <div id="cereb-ref" style="font-size:var(--text-xs); color:var(--text-muted); padding-bottom:8px;"></div>
        <div></div>
        <div class="input-group"><label for="cm-input">Cisterna magna AP</label><input type="number" id="cm-input" class="no-spinner" min="0" step="0.1" value="${formState.cisternaMagna ?? ''}" placeholder="mm"></div>
        <div id="cm-ref" style="font-size:var(--text-xs); color:var(--text-muted); padding-bottom:8px;">Normal 2\u201310 mm</div>
        <div></div>
      </div>
    `;
    measCard.querySelector('#bpd-input').addEventListener('input', (e) => { formState.bpd = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    measCard.querySelector('#cereb-input').addEventListener('input', (e) => { formState.cerebellum = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    measCard.querySelector('#cm-input').addEventListener('input', (e) => { formState.cisternaMagna = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    stepContainer.appendChild(measCard);

    update();
  }

  function update() {
    const r = calculateFetalBiometry(formState);
    badgeBpd.textContent = r.bpdLabel;

    // Update reference hints
    const bpdRef = document.getElementById('bpd-ref');
    const cerebRef = document.getElementById('cereb-ref');
    const cmRef = document.getElementById('cm-ref');
    if (bpdRef) bpdRef.textContent = r.bpdMean ? `Mean: ${r.bpdMean} (${r.bpdInterpretation})` : '';
    if (cerebRef) cerebRef.textContent = r.cerebellumMean ? `Mean: ${r.cerebellumMean} (${r.cerebellumInterpretation})` : '';
    if (cmRef) cmRef.textContent = r.cmInterpretation || 'Normal 2\u201310 mm';

    updateReport();
  }

  function updateReport() {
    const data = calculateFetalBiometry(formState);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, fetalBiometryDefinition);
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
