import '../../styles/base.css';
import '../../styles/forms.css';
import './aast-kidney.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { aastKidneyDefinition } from './definition.js';
import { calculateAast } from '../aast-liver/calculator.js';
import { buildKidneyTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

const definition = aastKidneyDefinition;
const templates = buildKidneyTemplates();

// Build a side-specific state: { selectedFindings: Set, multipleInjuries: bool }
function makeSideState() {
  return { selectedFindings: new Set(), multipleInjuries: false };
}

/**
 * Kidney is a paired organ. The formState tracks laterality and independent
 * per-side findings so the user can grade a right, left, or bilateral injury.
 */
function makeFormState() {
  return {
    laterality: 'right',          // 'right' | 'left' | 'bilateral'
    right: makeSideState(),
    left: makeSideState(),
  };
}

/**
 * Compute template data for the current kidney state. Delegates the per-side
 * grading to the shared calculateAast(), then merges the results into a single
 * view that the existing report templates can render.
 */
function computeKidneyData(formState) {
  const { laterality } = formState;

  if (laterality === 'bilateral') {
    const r = calculateAast(formState.right, definition);
    const l = calculateAast(formState.left, definition);

    const gradeParts = [];
    if (r.gradeLabel !== '--') gradeParts.push(`Right ${r.gradeLabel}`);
    if (l.gradeLabel !== '--') gradeParts.push(`Left ${l.gradeLabel}`);
    const combinedGradeLabel = gradeParts.length ? gradeParts.join(', ') : '--';
    const gradeLevel = Math.max(r.gradeLevel, l.gradeLevel);

    // Header line used in the report
    const gradeHeader = gradeParts.length
      ? `AAST kidney injuries: ${gradeParts.join(', ')}`
      : 'AAST kidney injury: --';

    // Findings text includes explicit side labels
    const findingsLines = [];
    if (r.hasFindings) {
      findingsLines.push('Right kidney:');
      findingsLines.push(r.findingsText);
    }
    if (l.hasFindings) {
      if (findingsLines.length) findingsLines.push('');
      findingsLines.push('Left kidney:');
      findingsLines.push(l.findingsText);
    }
    const findingsText = findingsLines.length
      ? findingsLines.join('\n')
      : 'No injuries identified.';
    const hasFindings = r.hasFindings || l.hasFindings;

    return {
      organ: 'Kidney',
      grade: gradeLevel || null,
      gradeLabel: combinedGradeLabel,
      gradeLevel,
      gradeHeader,
      findingsText,
      hasFindings,
      findingsProvided: hasFindings,
      multipleInjuries: formState.right.multipleInjuries || formState.left.multipleInjuries,
      selectedCount: r.selectedCount + l.selectedCount,
      laterality,
    };
  }

  // Single side (right or left)
  const side = formState[laterality];
  const sideLabel = laterality === 'right' ? 'right' : 'left';
  const result = calculateAast(side, definition);

  const gradeHeader = result.gradeLabel !== '--'
    ? `AAST ${sideLabel} kidney injury: ${result.gradeLabel}`
    : `AAST ${sideLabel} kidney injury: --`;

  const findingsText = result.hasFindings
    ? `${sideLabel.charAt(0).toUpperCase() + sideLabel.slice(1)} kidney:\n${result.findingsText}`
    : 'No injuries identified.';

  return {
    ...result,
    organ: 'Kidney',
    gradeHeader,
    findingsText,
    laterality,
  };
}

function init() {
  trackEvent('tool:aast-kidney:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeGrade = document.getElementById('badge-grade');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = definition.id;
  reportEl.definition = definition;
  reportEl.setTemplates(templates);

  const formState = makeFormState();
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Laterality picker at the top
    const lateralityCard = document.createElement('div');
    lateralityCard.className = 'step-card card';
    lateralityCard.innerHTML = `
      <div class="step-card__question">Laterality</div>
      <div class="kidney-laterality">
        <button class="benign-choice ${formState.laterality === 'right' ? 'benign-choice--active' : ''}" data-laterality="right">Right</button>
        <button class="benign-choice ${formState.laterality === 'left' ? 'benign-choice--active' : ''}" data-laterality="left">Left</button>
        <button class="benign-choice ${formState.laterality === 'bilateral' ? 'benign-choice--active' : ''}" data-laterality="bilateral">Bilateral</button>
      </div>
    `;
    lateralityCard.querySelectorAll('[data-laterality]').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.laterality = btn.dataset.laterality;
        buildUI();
      });
    });
    stepContainer.appendChild(lateralityCard);

    // Per-side forms
    if (formState.laterality === 'bilateral') {
      buildSideForm('right', 'Right kidney');
      buildSideForm('left', 'Left kidney');
    } else {
      buildSideForm(formState.laterality, null);
    }

    update();
  }

  function buildSideForm(side, headerLabel) {
    // Optional section header (only shown in bilateral mode)
    if (headerLabel) {
      const header = document.createElement('div');
      header.className = 'kidney-side-header';
      header.textContent = headerLabel;
      stepContainer.appendChild(header);
    }

    const sideState = formState[side];

    for (const cat of definition.categories) {
      const card = document.createElement('div');
      card.className = 'step-card card';
      card.innerHTML = `
        <div class="step-card__question">${cat.label}</div>
        <div class="aast-category">
          ${cat.findings.map((f) => `
            <button class="benign-choice ${sideState.selectedFindings.has(f.id) ? 'benign-choice--active' : ''}"
              data-finding="${f.id}" data-side="${side}" title="Grade ${f.grade}">${f.label}</button>
          `).join('')}
        </div>
      `;
      card.querySelectorAll('.benign-choice').forEach((btn) => {
        btn.addEventListener('click', () => {
          const fid = btn.dataset.finding;
          if (sideState.selectedFindings.has(fid)) {
            sideState.selectedFindings.delete(fid);
            btn.classList.remove('benign-choice--active');
          } else {
            sideState.selectedFindings.add(fid);
            btn.classList.add('benign-choice--active');
          }
          update();
        });
      });
      stepContainer.appendChild(card);
    }

    // Multiple-injury checkbox for this side
    const multiCard = document.createElement('div');
    multiCard.className = 'card';
    const checkboxId = `multi-injuries-${side}`;
    multiCard.innerHTML = `
      <label class="aast-multi-check">
        <input type="checkbox" id="${checkboxId}" ${sideState.multipleInjuries ? 'checked' : ''}>
        Multiple Grade I/II injuries present (advances to Grade III)
      </label>
    `;
    multiCard.querySelector(`#${checkboxId}`).addEventListener('change', (e) => {
      sideState.multipleInjuries = e.target.checked;
      update();
    });
    stepContainer.appendChild(multiCard);
  }

  function update() {
    const result = computeKidneyData(formState);
    badgeGrade.textContent = result.gradeLabel;
    badgeGrade.dataset.level = result.gradeLevel;
    updateReport();
  }

  function updateReport() {
    const data = computeKidneyData(formState);
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

  // Parse-to-autofill writes into the currently-selected side. For bilateral,
  // defaults to the right side; user can manually redistribute.
  const parseBtn = document.getElementById('parse-btn');
  const parseInput = document.getElementById('parse-input');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, aastKidneyDefinition);
    const targetSide = formState.laterality === 'left' ? 'left' : 'right';
    Object.assign(formState[targetSide], parsed);
    additionalFindingsEl.value = remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;
    buildUI();
    const total = matched.length + unmatched.length;
    parseStatus.textContent = `Matched ${matched.length}/${total} to ${targetSide} kidney${remainder ? ' -- remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
