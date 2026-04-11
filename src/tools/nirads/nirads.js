import '../../styles/base.css';
import '../../styles/forms.css';
import './nirads.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { niradsDefinition } from './definition.js';
import { calculateNirads } from './calculator.js';
import { niradsTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';

function init() {
  trackEvent('tool:nirads:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgePrimary = document.getElementById('badge-primary');
  const badgeNeck = document.getElementById('badge-neck');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = niradsDefinition.id;
  reportEl.definition = niradsDefinition;
  reportEl.setTemplates(niradsTemplates);

  const formState = { primaryCategory: null, neckCategory: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Primary site
    const primaryCard = document.createElement('div');
    primaryCard.className = 'step-card card';
    primaryCard.innerHTML = `
      <div class="step-card__question">Primary Site</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${niradsDefinition.primaryCategories.map((c) => `
          <button class="benign-choice ${formState.primaryCategory === c.id ? 'benign-choice--active' : ''}"
            data-cat="${c.id}" style="text-align:left; justify-content:flex-start;">
            ${c.label}<br><span style="font-size:var(--text-xs); color:var(--text-muted);">${c.findings} | ${c.management}</span>
          </button>
        `).join('')}
      </div>
    `;
    primaryCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.primaryCategory = btn.dataset.cat;
        primaryCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.cat === formState.primaryCategory));
        update();
      });
    });
    stepContainer.appendChild(primaryCard);

    // Neck
    const neckCard = document.createElement('div');
    neckCard.className = 'step-card card';
    neckCard.innerHTML = `
      <div class="step-card__question">Neck (Lymph Nodes)</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${niradsDefinition.neckCategories.map((c) => `
          <button class="benign-choice ${formState.neckCategory === c.id ? 'benign-choice--active' : ''}"
            data-ncat="${c.id}" style="text-align:left; justify-content:flex-start;">
            ${c.label} <span style="color:var(--text-muted); margin-left:auto; font-size:var(--text-xs);">${c.management}</span>
          </button>
        `).join('')}
      </div>
    `;
    neckCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.neckCategory = btn.dataset.ncat;
        neckCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.ncat === formState.neckCategory));
        update();
      });
    });
    stepContainer.appendChild(neckCard);

    update();
  }

  function update() {
    const result = calculateNirads(formState);
    badgePrimary.textContent = result.primaryCategory;
    badgeNeck.textContent = result.neckCategory;
    updateReport();
  }

  function updateReport() {
    const data = calculateNirads(formState);
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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, niradsDefinition);
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
