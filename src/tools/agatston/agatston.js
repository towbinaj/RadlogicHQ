import '../../styles/base.css';
import '../../styles/forms.css';
import './agatston.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { agatstonDefinition } from './definition.js';
import { calculateAgatston } from './calculator.js';
import { agatstonTemplates } from './templates.js';

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeRisk = document.getElementById('badge-risk');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = agatstonDefinition.id;
  reportEl.definition = agatstonDefinition;
  reportEl.setTemplates(agatstonTemplates);

  const formState = { score: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="step-card__question">Agatston Score</div>
      <div style="display:flex; gap:var(--space-sm); align-items:end;">
        <div class="input-group" style="max-width:200px;">
          <label for="agatston-score">Total calcium score</label>
          <input type="number" id="agatston-score" class="no-spinner" min="0" step="1" value="${formState.score ?? ''}" placeholder="Enter score">
        </div>
        <div id="agatston-category" style="font-weight:600; padding-bottom:8px;">—</div>
      </div>
    `;
    card.querySelector('#agatston-score').addEventListener('input', (e) => {
      formState.score = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    stepContainer.appendChild(card);

    // Reference table
    const refCard = document.createElement('div');
    refCard.className = 'card';
    refCard.innerHTML = `
      <div class="step-card__question">Risk Categories</div>
      <table style="width:100%; font-size:var(--text-sm); border-collapse:collapse;">
        <thead><tr><th style="text-align:left; padding:4px;">Score</th><th style="text-align:left; padding:4px;">Category</th><th style="text-align:left; padding:4px;">Risk</th></tr></thead>
        <tbody>
          ${agatstonDefinition.riskCategories.map((c) => `
            <tr style="border-top:1px solid var(--border);">
              <td style="padding:4px;">${c.min}${c.max === Infinity ? '+' : '–' + c.max}</td>
              <td style="padding:4px;">${c.label}</td>
              <td style="padding:4px;">${c.risk}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    stepContainer.appendChild(refCard);

    update();
  }

  function update() {
    const result = calculateAgatston(formState);
    badgeRisk.textContent = result.risk || '--';
    badgeRisk.dataset.level = result.level;
    const catEl = document.getElementById('agatston-category');
    if (catEl) catEl.textContent = result.categoryLabel !== '--' ? result.categoryLabel : '—';
    updateReport();
  }

  function updateReport() {
    const data = calculateAgatston(formState);
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
