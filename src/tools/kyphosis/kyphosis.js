import '../../styles/base.css';
import '../../styles/forms.css';
import './kyphosis.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { kyphosisDefinition } from './definition.js';
import { calculateKyphosis } from './calculator.js';
import { kyphosisTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';

function esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

function init() {
  trackEvent('tool:kyphosis:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeKyphosis = document.getElementById('badge-kyphosis');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = kyphosisDefinition.id;
  reportEl.definition = kyphosisDefinition;
  reportEl.setTemplates(kyphosisTemplates);

  const formState = { thoracicAngle: null, lumbarAngle: null, wedging: null, scheuermann: false, priorThoracic: '', priorLumbar: '' };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Measurements
    const measCard = document.createElement('div');
    measCard.className = 'card';
    measCard.innerHTML = `
      <div class="step-card__question">Cobb Angle Measurements</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-sm);">
        <div class="input-group">
          <label for="thoracic-angle">Thoracic Kyphosis (T4-T12) °</label>
          <input type="number" id="thoracic-angle" class="no-spinner" min="0" max="180" step="0.1" value="${formState.thoracicAngle ?? ''}" placeholder="°">
        </div>
        <div class="input-group">
          <label for="lumbar-angle">Lumbar Lordosis (L1-S1) °</label>
          <input type="number" id="lumbar-angle" class="no-spinner" min="0" max="180" step="0.1" value="${formState.lumbarAngle ?? ''}" placeholder="°">
        </div>
        <div class="input-group">
          <label for="prior-thoracic">Prior Thoracic</label>
          <input type="text" id="prior-thoracic" value="${esc(formState.priorThoracic)}" placeholder="e.g. 35° (1/2024)">
        </div>
        <div class="input-group">
          <label for="prior-lumbar">Prior Lumbar</label>
          <input type="text" id="prior-lumbar" value="${esc(formState.priorLumbar)}" placeholder="e.g. 50° (1/2024)">
        </div>
      </div>
    `;
    measCard.querySelector('#thoracic-angle').addEventListener('input', (e) => { formState.thoracicAngle = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    measCard.querySelector('#lumbar-angle').addEventListener('input', (e) => { formState.lumbarAngle = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    measCard.querySelector('#prior-thoracic').addEventListener('input', (e) => { formState.priorThoracic = e.target.value; update(); });
    measCard.querySelector('#prior-lumbar').addEventListener('input', (e) => { formState.priorLumbar = e.target.value; update(); });
    stepContainer.appendChild(measCard);

    // Scheuermann assessment
    const schCard = document.createElement('div');
    schCard.className = 'step-card card';
    schCard.innerHTML = `
      <div class="step-card__question">Scheuermann Assessment</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        <div class="input-group"><label for="sel-wedging">Anterior Vertebral Body Wedging</label>
          <select id="sel-wedging"><option value="">—</option>${kyphosisDefinition.wedgingOptions.map((o) => `<option value="${o.id}" ${formState.wedging === o.id ? 'selected' : ''}>${o.label}</option>`).join('')}</select>
        </div>
        <label style="display:flex; align-items:center; gap:var(--space-xs); font-size:var(--text-sm);">
          <input type="checkbox" id="scheuermann-check" ${formState.scheuermann ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--primary);">
          Scheuermann disease (kyphosis >40° + wedging ≥5° in ≥3 vertebrae)
        </label>
      </div>
    `;
    schCard.querySelector('#sel-wedging').addEventListener('change', (e) => { formState.wedging = e.target.value || null; update(); });
    schCard.querySelector('#scheuermann-check').addEventListener('change', (e) => { formState.scheuermann = e.target.checked; update(); });
    stepContainer.appendChild(schCard);

    update();
  }

  function update() {
    const result = calculateKyphosis(formState);
    badgeKyphosis.textContent = result.thoracicLabel;
    badgeKyphosis.dataset.level = result.thoracicLevel;
    updateReport();
  }

  function updateReport() {
    const data = calculateKyphosis(formState);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, kyphosisDefinition);
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
