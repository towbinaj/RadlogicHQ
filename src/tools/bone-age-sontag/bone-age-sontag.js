import '../../styles/base.css';
import '../../styles/forms.css';
import './bone-age-sontag.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { boneAgeSontagDefinition } from './definition.js';
import { calculateBoneAge } from '../bone-age/calculator.js';
import { boneAgeSontagTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';

function init() {
  trackEvent('tool:bone-age-sontag:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeBa = document.getElementById('badge-ba');
  const badgeDiff = document.getElementById('badge-diff');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = boneAgeSontagDefinition.id;
  reportEl.definition = boneAgeSontagDefinition;
  reportEl.setTemplates(boneAgeSontagTemplates);

  const formState = { sex: null, chronoYears: null, chronoMonths: null, boneAgeYears: null, boneAgeMonths: null, ossificationCount: null, method: 'Sontag' };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    const sexCard = document.createElement('div');
    sexCard.className = 'card';
    sexCard.innerHTML = `<div class="input-group"><label>Sex</label><div class="toggle-group">${boneAgeSontagDefinition.sexOptions.map((o) => `<button class="toggle-group__btn ${formState.sex === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>`;
    sexCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => { formState.sex = btn.dataset.value; sexCard.querySelectorAll('.toggle-group__btn').forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn)); update(); });
    });
    stepContainer.appendChild(sexCard);

    const chronoCard = document.createElement('div');
    chronoCard.className = 'card';
    chronoCard.innerHTML = `
      <div class="step-card__question">Chronological Age</div>
      <div style="display:flex; gap:var(--space-sm);">
        <div class="input-group" style="max-width:120px;"><label for="chrono-years">Years</label><input type="number" id="chrono-years" class="no-spinner" min="0" max="25" step="1" value="${formState.chronoYears ?? ''}" placeholder="Years"></div>
        <div class="input-group" style="max-width:120px;"><label for="chrono-months">Months</label><input type="number" id="chrono-months" class="no-spinner" min="0" max="11" step="1" value="${formState.chronoMonths ?? ''}" placeholder="Months"></div>
      </div>
    `;
    chronoCard.querySelector('#chrono-years').addEventListener('input', (e) => { formState.chronoYears = e.target.value !== '' ? parseInt(e.target.value) : null; update(); });
    chronoCard.querySelector('#chrono-months').addEventListener('input', (e) => { formState.chronoMonths = e.target.value !== '' ? parseInt(e.target.value) : null; update(); });
    stepContainer.appendChild(chronoCard);

    const baCard = document.createElement('div');
    baCard.className = 'card';
    baCard.innerHTML = `
      <div class="step-card__question">Bone Age (from ossification center count)</div>
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap;">
        <div class="input-group" style="max-width:160px;"><label for="ossification">Ossification centers</label><input type="number" id="ossification" class="no-spinner" min="0" max="100" step="1" value="${formState.ossificationCount ?? ''}" placeholder="Count"></div>
        <div class="input-group" style="max-width:120px;"><label for="ba-years">Years</label><input type="number" id="ba-years" class="no-spinner" min="0" max="25" step="1" value="${formState.boneAgeYears ?? ''}" placeholder="Years"></div>
        <div class="input-group" style="max-width:120px;"><label for="ba-months">Months</label><input type="number" id="ba-months" class="no-spinner" min="0" max="11" step="1" value="${formState.boneAgeMonths ?? ''}" placeholder="Months"></div>
      </div>
    `;
    baCard.querySelector('#ossification').addEventListener('input', (e) => { formState.ossificationCount = e.target.value !== '' ? parseInt(e.target.value) : null; update(); });
    baCard.querySelector('#ba-years').addEventListener('input', (e) => { formState.boneAgeYears = e.target.value !== '' ? parseInt(e.target.value) : null; update(); });
    baCard.querySelector('#ba-months').addEventListener('input', (e) => { formState.boneAgeMonths = e.target.value !== '' ? parseInt(e.target.value) : null; update(); });
    stepContainer.appendChild(baCard);
    update();
  }

  function update() {
    const r = calculateBoneAge(formState);
    badgeBa.textContent = r.boneAgeLabel || '--';
    badgeDiff.textContent = r.differenceLabel; badgeDiff.dataset.level = r.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateBoneAge(formState);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, boneAgeSontagDefinition);
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
