import '../../styles/base.css';
import '../../styles/forms.css';
import './lugano.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { luganoDefinition } from './definition.js';
import { calculateLugano } from './calculator.js';
import { luganoTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';

function init() {
  trackEvent('tool:lugano:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeStage = document.getElementById('badge-stage');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = luganoDefinition.id;
  reportEl.definition = luganoDefinition;
  reportEl.setTemplates(luganoTemplates);

  const formState = { stage: null, suffixes: [], lymphomaType: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = luganoDefinition;

    // Lymphoma type
    const typeCard = document.createElement('div');
    typeCard.className = 'card';
    typeCard.innerHTML = `
      <div class="input-group"><label>Lymphoma Type</label>
        <div class="toggle-group">${def.lymphomaTypeOptions.map((o) => `<button class="toggle-group__btn ${formState.lymphomaType === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div>
      </div>
    `;
    typeCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.lymphomaType = btn.dataset.value;
        typeCard.querySelectorAll('.toggle-group__btn').forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn));
        buildSuffixes();
        update();
      });
    });
    stepContainer.appendChild(typeCard);

    // Stage
    const stageCard = document.createElement('div');
    stageCard.className = 'step-card card';
    stageCard.innerHTML = `
      <div class="step-card__question">Stage</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${def.stages.map((s) => `
          <button class="benign-choice ${formState.stage === s.id ? 'benign-choice--active' : ''}"
            data-stage="${s.id}" style="text-align:left; justify-content:flex-start;">${s.label} — ${s.description}</button>
        `).join('')}
      </div>
    `;
    stageCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.stage = btn.dataset.stage;
        stageCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.stage === formState.stage));
        update();
      });
    });
    stepContainer.appendChild(stageCard);

    // Suffixes
    const suffixCard = document.createElement('div');
    suffixCard.className = 'step-card card';
    suffixCard.id = 'suffix-card';
    stepContainer.appendChild(suffixCard);
    buildSuffixes();

    update();
  }

  function buildSuffixes() {
    const card = document.getElementById('suffix-card');
    if (!card) return;
    const def = luganoDefinition;
    const availableSuffixes = def.suffixes.filter((s) => !s.hodgkinOnly || formState.lymphomaType === 'hodgkin');

    card.innerHTML = `
      <div class="step-card__question">Modifiers</div>
      <div style="display:flex; gap:var(--space-xs); flex-wrap:wrap;">
        ${availableSuffixes.map((s) => `
          <button class="benign-choice ${formState.suffixes.includes(s.id) ? 'benign-choice--active' : ''}"
            data-suffix="${s.id}">${s.label}</button>
        `).join('')}
      </div>
    `;
    card.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sid = btn.dataset.suffix;
        // A and B are mutually exclusive
        if (sid === 'A' || sid === 'B') {
          formState.suffixes = formState.suffixes.filter((s) => s !== 'A' && s !== 'B');
          if (!btn.classList.contains('benign-choice--active')) formState.suffixes.push(sid);
        } else {
          const idx = formState.suffixes.indexOf(sid);
          if (idx >= 0) formState.suffixes.splice(idx, 1);
          else formState.suffixes.push(sid);
        }
        buildSuffixes();
        update();
      });
    });
  }

  function update() {
    const result = calculateLugano(formState);
    badgeStage.textContent = result.fullLabel;
    badgeStage.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateLugano(formState);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, luganoDefinition);
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
