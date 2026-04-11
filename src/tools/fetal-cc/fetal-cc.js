import '../../styles/base.css';
import '../../styles/forms.css';
import './fetal-cc.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { fetalCCDefinition } from './definition.js';
import { calculateFetalCC } from './calculator.js';
import { fetalCCTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';

function init() {
  trackEvent('tool:fetal-cc:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeCc = document.getElementById('badge-cc');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = fetalCCDefinition.id;
  reportEl.definition = fetalCCDefinition;
  reportEl.setTemplates(fetalCCTemplates);

  const formState = { ga: null, ccLength: null, absent: false };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap; align-items:end;">
        <div class="input-group" style="max-width:140px;"><label for="ga-input">GA (weeks)</label><input type="number" id="ga-input" class="no-spinner" min="20" max="40" step="1" value="${formState.ga ?? ''}" placeholder="20\u201340"></div>
        <div class="input-group" style="max-width:160px;"><label for="cc-input">CC Length (mm)</label><input type="number" id="cc-input" class="no-spinner" min="0" max="60" step="0.1" value="${formState.ccLength ?? ''}" placeholder="mm" ${formState.absent ? 'disabled' : ''}></div>
        <label style="display:flex; align-items:center; gap:var(--space-xs); font-size:var(--text-sm); padding-bottom:8px;">
          <input type="checkbox" id="absent-check" ${formState.absent ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--primary);">
          Absent (agenesis)
        </label>
      </div>
      <div id="cc-ref" style="font-size:var(--text-sm); color:var(--text-muted); padding-top:var(--space-xs);"></div>
    `;
    card.querySelector('#ga-input').addEventListener('input', (e) => { formState.ga = e.target.value !== '' ? parseInt(e.target.value) : null; update(); });
    card.querySelector('#cc-input').addEventListener('input', (e) => { formState.ccLength = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    card.querySelector('#absent-check').addEventListener('change', (e) => {
      formState.absent = e.target.checked;
      if (formState.absent) { formState.ccLength = null; card.querySelector('#cc-input').value = ''; card.querySelector('#cc-input').disabled = true; }
      else { card.querySelector('#cc-input').disabled = false; }
      update();
    });
    stepContainer.appendChild(card);

    update();
  }

  function update() {
    const r = calculateFetalCC(formState);
    badgeCc.textContent = r.ccLabel;
    badgeCc.dataset.level = r.level;
    const ref = document.getElementById('cc-ref');
    if (ref) {
      if (r.absent) ref.textContent = 'Corpus callosum absent — agenesis';
      else if (r.expectedProvided && r.interpretationProvided) ref.textContent = `Expected: ${r.expectedLabel} | ${r.interpretation}`;
      else if (r.expectedProvided) ref.textContent = `Expected at ${formState.ga} weeks: ${r.expectedLabel}`;
      else ref.textContent = '';
    }
    updateReport();
  }

  function updateReport() {
    const data = calculateFetalCC(formState);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, fetalCCDefinition);
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
