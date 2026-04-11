import '../../styles/base.css';
import '../../styles/forms.css';
import './pectus.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { pectusDefinition } from './definition.js';
import { calculatePectus } from './calculator.js';
import { pectusTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:pectus:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgePi = document.getElementById('badge-pi');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = pectusDefinition.id;
  reportEl.definition = pectusDefinition;
  reportEl.setTemplates(pectusTemplates);

  const fs = { piWidth: null, piDepth: null, ciDepthA: null, ciDepthB: null, diDepth: null, diVertWidth: null, mcciH: null, mcciM: null, staAngle: null, staTilt: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function inp(id, field) {
    return `<input type="number" id="${id}" class="no-spinner" min="0" step="0.1" value="${fs[field] ?? ''}" style="width:100%;">`;
  }

  function buildUI() {
    stepContainer.innerHTML = '';

    // PI
    const piCard = document.createElement('div');
    piCard.className = 'card';
    piCard.innerHTML = `
      <div class="step-card__question">Pectus Index (Haller Index)</div>
      <div class="pectus-grid">
        <div class="input-group"><label for="pi-width">Transverse width (mm)</label>${inp('pi-width', 'piWidth')}</div>
        <div class="input-group"><label for="pi-depth">AP depth — sternum to vertebra (mm)</label>${inp('pi-depth', 'piDepth')}</div>
      </div>
      <div class="pectus-result" id="pi-result">PI: --</div>
    `;
    wire(piCard, 'pi-width', 'piWidth');
    wire(piCard, 'pi-depth', 'piDepth');
    stepContainer.appendChild(piCard);

    // CI
    const ciCard = document.createElement('div');
    ciCard.className = 'card';
    ciCard.innerHTML = `
      <div class="step-card__question">Correction Index</div>
      <div class="pectus-grid">
        <div class="input-group"><label for="ci-depthA">Depth A — anterior chest to vertebra (mm)</label>${inp('ci-depthA', 'ciDepthA')}</div>
        <div class="input-group"><label for="ci-depthB">Depth B — sternum to vertebra (mm)</label>${inp('ci-depthB', 'ciDepthB')}</div>
      </div>
      <div class="pectus-result" id="ci-result">CI: --</div>
    `;
    wire(ciCard, 'ci-depthA', 'ciDepthA');
    wire(ciCard, 'ci-depthB', 'ciDepthB');
    stepContainer.appendChild(ciCard);

    // DI
    const diCard = document.createElement('div');
    diCard.className = 'card';
    diCard.innerHTML = `
      <div class="step-card__question">Depression Index</div>
      <div class="pectus-grid">
        <div class="input-group"><label for="di-depth">Depression depth — rib to sternum (mm)</label>${inp('di-depth', 'diDepth')}</div>
        <div class="input-group"><label for="di-vert">Vertebral body width (mm)</label>${inp('di-vert', 'diVertWidth')}</div>
      </div>
      <div class="pectus-result" id="di-result">DI: --</div>
    `;
    wire(diCard, 'di-depth', 'diDepth');
    wire(diCard, 'di-vert', 'diVertWidth');
    stepContainer.appendChild(diCard);

    // mCCI
    const mcciCard = document.createElement('div');
    mcciCard.className = 'card';
    mcciCard.innerHTML = `
      <div class="step-card__question">Modified Cardiac Compression Index (mCCI)</div>
      <div class="pectus-grid">
        <div class="input-group"><label for="mcci-h">H — pericardium to pericardium (mm)</label>${inp('mcci-h', 'mcciH')}</div>
        <div class="input-group"><label for="mcci-m">M — minimum AP cardiac (mm)</label>${inp('mcci-m', 'mcciM')}</div>
      </div>
      <div class="pectus-result" id="mcci-result">mCCI: --</div>
    `;
    wire(mcciCard, 'mcci-h', 'mcciH');
    wire(mcciCard, 'mcci-m', 'mcciM');
    stepContainer.appendChild(mcciCard);

    // STA
    const staCard = document.createElement('div');
    staCard.className = 'card';
    staCard.innerHTML = `
      <div class="step-card__question">Sternal Torsion Angle</div>
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap; align-items:end;">
        <div class="input-group" style="max-width:120px;"><label for="sta-angle">Angle \u00b0</label><input type="number" id="sta-angle" class="no-spinner" min="0" max="90" step="0.1" value="${fs.staAngle ?? ''}" placeholder="\u00b0"></div>
        <div class="input-group"><label>Tilt</label><div class="toggle-group">${pectusDefinition.staTiltOptions.map((o) => `<button class="toggle-group__btn ${fs.staTilt === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>
      </div>
    `;
    staCard.querySelector('#sta-angle').addEventListener('input', (e) => { fs.staAngle = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    staCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => { fs.staTilt = btn.dataset.value; staCard.querySelectorAll('.toggle-group__btn').forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn)); update(); });
    });
    stepContainer.appendChild(staCard);

    update();
  }

  function wire(card, id, field) {
    card.querySelector(`#${id}`).addEventListener('input', (e) => {
      fs[field] = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshResults();
      update();
    });
  }

  function refreshResults() {
    const r = calculatePectus(fs);
    const piEl = document.getElementById('pi-result');
    const ciEl = document.getElementById('ci-result');
    const diEl = document.getElementById('di-result');
    const mcciEl = document.getElementById('mcci-result');
    if (piEl) piEl.textContent = `PI: ${r.piLabel}${r.piProvided ? ` (${r.piInterpretation})` : ''}`;
    if (ciEl) ciEl.textContent = `CI: ${r.ciLabel}${r.ciProvided ? ` (${r.ciInterpretation})` : ''}`;
    if (diEl) diEl.textContent = `DI: ${r.diLabel}${r.diProvided ? ` (${r.diInterpretation})` : ''}`;
    if (mcciEl) mcciEl.textContent = `mCCI: ${r.mcciLabel}`;
  }

  function update() {
    const r = calculatePectus(fs);
    badgePi.textContent = r.piLabel;
    badgePi.dataset.level = r.level;
    updateReport();
  }

  function updateReport() {
    const data = calculatePectus(fs);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, pectusDefinition);
    Object.assign(fs, parsed);
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
