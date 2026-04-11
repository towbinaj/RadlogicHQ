import '../../styles/base.css';
import '../../styles/forms.css';
import './birads.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { biradsDefinition } from './definition.js';
import { calculateBirads } from './calculator.js';
import { biradsTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';

function init() {
  trackEvent('tool:birads:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeCategory = document.getElementById('badge-category');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = biradsDefinition.id;
  reportEl.definition = biradsDefinition;
  reportEl.setTemplates(biradsTemplates);

  const formState = { category: null, modality: null, laterality: null };
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = biradsDefinition;

    // Modality + laterality row
    const metaCard = document.createElement('div');
    metaCard.className = 'card';
    metaCard.innerHTML = `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap;">
        <div class="input-group" style="flex:1; min-width:140px;">
          <label>Modality</label>
          <div class="toggle-group">
            ${def.modalityOptions.map((o) => `
              <button class="toggle-group__btn ${formState.modality === o.id ? 'toggle-group__btn--active' : ''}"
                data-field="modality" data-value="${o.id}">${o.label}</button>
            `).join('')}
          </div>
        </div>
        <div class="input-group" style="flex:1; min-width:140px;">
          <label>Laterality</label>
          <div class="toggle-group">
            ${def.lateralityOptions.map((o) => `
              <button class="toggle-group__btn ${formState.laterality === o.id ? 'toggle-group__btn--active' : ''}"
                data-field="laterality" data-value="${o.id}">${o.label}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    metaCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.field;
        formState[field] = btn.dataset.value;
        metaCard.querySelectorAll(`.toggle-group__btn[data-field="${field}"]`).forEach((b) =>
          b.classList.toggle('toggle-group__btn--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(metaCard);

    // Category selection
    const catCard = document.createElement('div');
    catCard.className = 'step-card card';
    catCard.innerHTML = `
      <div class="step-card__question">Assessment Category</div>
      <div class="benign-choices" style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${def.categories.map((c) => `
          <button class="benign-choice ${formState.category === c.id ? 'benign-choice--active' : ''}"
            data-cat="${c.id}" style="text-align:left; justify-content:flex-start;">
            ${c.label}
          </button>
        `).join('')}
      </div>
      <div class="birads-info" id="birads-info"></div>
    `;
    catCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.category = btn.dataset.cat;
        catCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b.dataset.cat === formState.category));
        update();
        showInfo();
      });
    });
    stepContainer.appendChild(catCard);

    function showInfo() {
      const info = catCard.querySelector('#birads-info');
      const cat = def.categories.find((c) => c.id === formState.category);
      if (cat) {
        info.textContent = `Risk: ${cat.risk} | ${cat.management}`;
      } else {
        info.textContent = '';
      }
    }
    showInfo();

    update();
  }

  function update() {
    const result = calculateBirads(formState);
    badgeCategory.textContent = result.category;
    badgeCategory.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateBirads(formState);
    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        let text = renderEditorContent(config.editorContent, config.pillStates, data);
        if (studyAdditionalFindings.trim()) text += '\n\n' + (config.sectionHeaders?.additionalFindings ?? 'Other findings:') + '\n' + studyAdditionalFindings.trim();
        return text;
      }
      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];
      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + renderBlocks(blocks, data, false));
      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      const otherFindings = studyAdditionalFindings.trim() || 'None.';
      sections.push((headers.additionalFindings ?? 'Other findings:') + '\n' + otherFindings);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, biradsDefinition);
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
