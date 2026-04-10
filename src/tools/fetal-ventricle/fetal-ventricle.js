import '../../styles/base.css';
import '../../styles/forms.css';
import './fetal-ventricle.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { fetalVentricleDefinition } from './definition.js';
import { calculateFetalVentricle } from './calculator.js';
import { fetalVentricleTemplates } from './templates.js';

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeWidth = document.getElementById('badge-width');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = fetalVentricleDefinition.id;
  reportEl.definition = fetalVentricleDefinition;
  reportEl.setTemplates(fetalVentricleTemplates);

  const formState = { width: null, side: null, ga: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap; align-items:end;">
        <div class="input-group"><label>Side</label><div class="toggle-group">${fetalVentricleDefinition.sideOptions.map((o) => `<button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>
        <div class="input-group" style="max-width:120px;"><label for="ga-input">GA (weeks)</label><input type="number" id="ga-input" class="no-spinner" min="16" max="40" step="1" value="${formState.ga ?? ''}" placeholder="weeks"></div>
        <div class="input-group" style="max-width:140px;"><label for="width-input">Atrial width (mm)</label><input type="number" id="width-input" class="no-spinner" min="0" max="50" step="0.1" value="${formState.width ?? ''}" placeholder="mm"></div>
      </div>
    `;
    card.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => { formState.side = btn.dataset.value; card.querySelectorAll('.toggle-group__btn').forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn)); update(); });
    });
    card.querySelector('#ga-input').addEventListener('input', (e) => { formState.ga = e.target.value !== '' ? parseInt(e.target.value) : null; update(); });
    card.querySelector('#width-input').addEventListener('input', (e) => { formState.width = e.target.value !== '' ? parseFloat(e.target.value) : null; update(); });
    stepContainer.appendChild(card);

    // Reference table
    const refCard = document.createElement('div');
    refCard.className = 'card';
    refCard.innerHTML = `
      <div class="step-card__question">Classification</div>
      <table style="width:100%; font-size:var(--text-sm); border-collapse:collapse;">
        <thead><tr><th style="text-align:left; padding:4px;">Width</th><th style="text-align:left; padding:4px;">Category</th></tr></thead>
        <tbody>${fetalVentricleDefinition.categories.map((c) => `
          <tr style="border-top:1px solid var(--border);"><td style="padding:4px;">${c.range}</td><td style="padding:4px;">${c.label}</td></tr>
        `).join('')}</tbody>
      </table>
      <div style="font-size:var(--text-xs); color:var(--text-muted); margin-top:var(--space-xs);">Threshold is GA-independent (stable throughout 2nd/3rd trimester)</div>
    `;
    stepContainer.appendChild(refCard);

    update();
  }

  function update() {
    const r = calculateFetalVentricle(formState);
    badgeWidth.textContent = r.widthLabel;
    badgeWidth.dataset.level = r.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateFetalVentricle(formState);
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
