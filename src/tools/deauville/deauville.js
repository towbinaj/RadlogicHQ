import '../../styles/base.css';
import '../../styles/forms.css';
import './deauville.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { deauvilleDefinition } from './definition.js';
import { calculateDeauville } from './calculator.js';
import { deauvilleTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';
import { trackEvent } from '../../core/storage.js';
import { initKeyboardShortcuts } from '../../core/keyboard-shortcuts.js';
import '../../core/tool-name.js';

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  trackEvent('tool:deauville:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const scoreDisplay = document.getElementById('deauville-score');
  const responseDisplay = document.getElementById('deauville-response');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = deauvilleDefinition.id;
  reportEl.definition = deauvilleDefinition;
  reportEl.setTemplates(deauvilleTemplates);

  const formState = {};
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = deauvilleDefinition;

    // Block 1: Timing
    const timingCard = document.createElement('div');
    timingCard.className = 'step-card card';
    timingCard.innerHTML = `
      <div class="step-card__question">Study Timing</div>
      <div class="benign-choices">
        ${def.timingOptions.map((o) => `
          <button class="benign-choice ${formState.timing === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}" ${o.tooltip ? `title="${esc(o.tooltip)}"` : ''}>${o.label}</button>
        `).join('')}
      </div>
    `;
    timingCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.timing = btn.dataset.value;
        timingCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(timingCard);

    // Block 2: Deauville score — large clickable cards
    const scoreCard = document.createElement('div');
    scoreCard.className = 'step-card card';
    scoreCard.innerHTML = `
      <div class="step-card__question">Deauville Score</div>
      <div class="deauville-scores">
        ${def.scores.map((s) => `
          <button class="deauville-score-card ${formState.score === s.id ? 'deauville-score-card--active' : ''}"
            data-score="${s.id}" data-level="${s.id}" title="${esc(s.tooltip)}">
            ${s.image ? `<img class="deauville-option-img" src="${s.image}" alt="Score ${s.shortLabel}">` : ''}
            <span class="deauville-score-card__num">${s.shortLabel}</span>
            <span class="deauville-score-card__desc">${s.tooltip}</span>
          </button>
        `).join('')}
      </div>
    `;
    scoreCard.querySelectorAll('.deauville-score-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.score = btn.dataset.score;
        scoreCard.querySelectorAll('.deauville-score-card').forEach((b) =>
          b.classList.toggle('deauville-score-card--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(scoreCard);

    // Block 3: New lesions
    const nlCard = document.createElement('div');
    nlCard.className = 'step-card card';
    nlCard.innerHTML = `
      <div class="step-card__question">New Lesions</div>
      <div class="benign-choices">
        ${def.newLesionOptions.map((o) => `
          <button class="benign-choice ${formState.newLesion === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}">${o.label}</button>
        `).join('')}
      </div>
    `;
    nlCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.newLesion = btn.dataset.value;
        nlCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(nlCard);

    update();
  }

  function update() {
    const result = calculateDeauville(formState);

    scoreDisplay.textContent = result.scoreShortLabel;
    scoreDisplay.dataset.level = result.scoreLevel;

    responseDisplay.textContent = result.response;
    responseDisplay.dataset.level = result.responseLevel;

    updateReport();
  }

  function updateReport() {
    const result = calculateDeauville(formState);
    const data = { ...result };

    const impressionParts = [];
    if (data.timingProvided) impressionParts.push(`${data.timingLabel} PET/CT.`);
    if (data.score) impressionParts.push(`Deauville ${data.score}.`);
    impressionParts.push(data.responseFullLabel + '.');
    if (data.hasNewLesion) impressionParts.push('New lesions identified.');
    const impressionSummary = impressionParts.join(' ');

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        let text = renderEditorContent(config.editorContent, config.pillStates, { ...data, impressionSummary });
        if (studyAdditionalFindings.trim()) {
          text += '\n\nADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim();
        }
        return text;
      }

      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];

      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + renderBlocks(blocks, data, false));
      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      if (studyAdditionalFindings.trim()) sections.push((headers.additionalFindings ?? 'ADDITIONAL FINDINGS:') + '\n' + studyAdditionalFindings.trim());
      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, { impressionSummary }));
      }
      return sections.join('\n\n');
    };
    reportEl.updateReport(data);
  }

  // Parse
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, deauvilleDefinition);
    for (const key of Object.keys(formState)) delete formState[key];
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
  initKeyboardShortcuts({ container: stepContainer });
}

document.addEventListener('DOMContentLoaded', init);
