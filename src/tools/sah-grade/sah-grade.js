import '../../styles/base.css';
import '../../styles/forms.css';
import './sah-grade.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { sahDefinition } from './definition.js';
import { calculateSah } from './calculator.js';
import { sahTemplates } from './templates.js';

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeHh = document.getElementById('badge-hh');
  const badgeMf = document.getElementById('badge-mf');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = sahDefinition.id;
  reportEl.definition = sahDefinition;
  reportEl.setTemplates(sahTemplates);

  const formState = { huntHess: null, modifiedFisher: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Hunt-Hess
    const hhCard = document.createElement('div');
    hhCard.className = 'step-card card';
    hhCard.innerHTML = `
      <div class="step-card__question">Hunt-Hess (Clinical)</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${sahDefinition.huntHessGrades.map((g) => `
          <button class="benign-choice ${formState.huntHess === g.id ? 'benign-choice--active' : ''}"
            data-hh="${g.id}" style="text-align:left; justify-content:flex-start;">${g.label} — ${g.description}</button>
        `).join('')}
      </div>
    `;
    hhCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.huntHess = btn.dataset.hh;
        hhCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.hh === formState.huntHess));
        update();
      });
    });
    stepContainer.appendChild(hhCard);

    // Modified Fisher
    const mfCard = document.createElement('div');
    mfCard.className = 'step-card card';
    mfCard.innerHTML = `
      <div class="step-card__question">Modified Fisher (CT)</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${sahDefinition.modifiedFisherGrades.map((g) => `
          <button class="benign-choice ${formState.modifiedFisher === g.id ? 'benign-choice--active' : ''}"
            data-mf="${g.id}" style="text-align:left; justify-content:flex-start;">${g.label} — ${g.description} <span style="color:var(--text-muted); margin-left:auto; font-size:var(--text-xs);">Vasospasm: ${g.vasospasm}</span></button>
        `).join('')}
      </div>
    `;
    mfCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.modifiedFisher = btn.dataset.mf;
        mfCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.mf === formState.modifiedFisher));
        update();
      });
    });
    stepContainer.appendChild(mfCard);

    update();
  }

  function update() {
    const result = calculateSah(formState);
    badgeHh.textContent = result.huntHessGrade;
    badgeMf.textContent = result.modifiedFisherGrade;
    updateReport();
  }

  function updateReport() {
    const data = calculateSah(formState);
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
