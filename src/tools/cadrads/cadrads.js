import '../../styles/base.css';
import '../../styles/forms.css';
import './cadrads.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { cadradsDefinition } from './definition.js';
import { calculateCadrads } from './calculator.js';
import { cadradsTemplates } from './templates.js';

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeCat = document.getElementById('badge-cat');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = cadradsDefinition.id;
  reportEl.definition = cadradsDefinition;
  reportEl.setTemplates(cadradsTemplates);

  const formState = { category: null, modifiers: [], plaqueBurden: null };
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = cadradsDefinition;

    // Category selection
    const catCard = document.createElement('div');
    catCard.className = 'step-card card';
    catCard.innerHTML = `
      <div class="step-card__question">Stenosis Category</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${def.categories.map((c) => `
          <button class="benign-choice ${formState.category === c.id ? 'benign-choice--active' : ''}"
            data-cat="${c.id}" style="text-align:left; justify-content:flex-start;">${c.label} <span style="color:var(--text-muted); margin-left:auto; font-size:var(--text-xs);">${c.stenosis}</span></button>
        `).join('')}
      </div>
    `;
    catCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.category = btn.dataset.cat;
        catCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.cat === formState.category));
        update();
      });
    });
    stepContainer.appendChild(catCard);

    // Modifiers (multi-select)
    const modCard = document.createElement('div');
    modCard.className = 'step-card card';
    modCard.innerHTML = `
      <div class="step-card__question">Modifiers</div>
      <div style="display:flex; gap:var(--space-xs); flex-wrap:wrap;">
        ${def.modifierOptions.map((m) => `
          <button class="benign-choice ${formState.modifiers.includes(m.id) ? 'benign-choice--active' : ''}"
            data-mod="${m.id}">${m.label}</button>
        `).join('')}
      </div>
    `;
    modCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mid = btn.dataset.mod;
        const idx = formState.modifiers.indexOf(mid);
        if (idx >= 0) { formState.modifiers.splice(idx, 1); btn.classList.remove('benign-choice--active'); }
        else { formState.modifiers.push(mid); btn.classList.add('benign-choice--active'); }
        update();
      });
    });
    stepContainer.appendChild(modCard);

    // Plaque burden
    const pbCard = document.createElement('div');
    pbCard.className = 'step-card card';
    pbCard.innerHTML = `
      <div class="step-card__question">Plaque Burden</div>
      <div style="display:flex; gap:var(--space-xs); flex-wrap:wrap;">
        ${def.plaqueBurdenOptions.map((p) => `
          <button class="benign-choice ${formState.plaqueBurden === p.id ? 'benign-choice--active' : ''}"
            data-pb="${p.id}">${p.label}</button>
        `).join('')}
      </div>
    `;
    pbCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.plaqueBurden = formState.plaqueBurden === btn.dataset.pb ? null : btn.dataset.pb;
        pbCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.pb === formState.plaqueBurden));
        update();
      });
    });
    stepContainer.appendChild(pbCard);

    update();
  }

  function update() {
    const result = calculateCadrads(formState);
    badgeCat.textContent = result.category;
    badgeCat.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateCadrads(formState);
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

  document.getElementById('parse-btn').addEventListener('click', () => { const s = document.getElementById('parse-status'); s.textContent = 'Parse not yet implemented'; s.className = 'parse-panel__status'; setTimeout(() => { s.textContent = ''; }, 3000); });
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
