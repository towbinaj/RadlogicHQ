import '../../styles/base.css';
import '../../styles/forms.css';
import './aast-kidney.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { getKidneyDefinition, KIDNEY_SCALES, KIDNEY_SCALE_STORAGE_KEY, DEFAULT_KIDNEY_SCALE } from './scales.js';
import { calculateAast } from '../aast-liver/calculator.js';
import { buildKidneyTemplates } from './templates.js';
import { trackEvent, getStored, setStored } from '../../core/storage.js';
import { parseFindings, parseSegmentedFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

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
function computeKidneyData(formState, definition) {
  const { laterality } = formState;
  // Name the scale in the report: grades differ between 2018 and 2025.
  const scale = definition.scaleVersion ? ` (${definition.scaleVersion} OIS)` : '';

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
      ? `AAST kidney injuries${scale}: ${gradeParts.join(', ')}`
      : `AAST kidney injury${scale}: --`;

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
    ? `AAST ${sideLabel} kidney injury${scale}: ${result.gradeLabel}`
    : `AAST ${sideLabel} kidney injury${scale}: --`;

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

  // 2018 / 2025 scale toggle, persisted and shared with AAST Multi.
  let scaleId = getStored(KIDNEY_SCALE_STORAGE_KEY, DEFAULT_KIDNEY_SCALE);
  let definition = getKidneyDefinition(scaleId);
  const modeTabsEl = document.getElementById('mode-tabs');

  reportEl.toolId = definition.id;
  reportEl.definition = definition;
  reportEl.setTemplates(templates);

  function renderModeTabs() {
    modeTabsEl.innerHTML = '';
    for (const s of KIDNEY_SCALES) {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${definition === s.definition ? 'active' : ''}`;
      tab.textContent = s.label;
      tab.title = s.id === '2025'
        ? 'Keihani et al., J Trauma Acute Care Surg 2025'
        : 'Kozar et al., J Trauma Acute Care Surg 2018';
      tab.addEventListener('click', () => {
        if (definition === s.definition) return;
        scaleId = s.id;
        definition = s.definition;
        setStored(KIDNEY_SCALE_STORAGE_KEY, scaleId);
        reportEl.definition = definition;
        // Finding ids differ between scales: start both sides fresh.
        formState.right = makeSideState();
        formState.left = makeSideState();
        renderModeTabs();
        buildUI();
      });
      modeTabsEl.appendChild(tab);
    }
  }
  renderModeTabs();

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
              data-finding="${f.id}" data-side="${side}" title="Grade ${['', 'I', 'II', 'III', 'IV', 'V'][f.grade]}${f.title ? `. ${f.title}` : ''}">${f.label}</button>
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

    // Multiple-injury checkbox for this side (2018 only: the 2025 update
    // does not upgrade multiple injuries).
    if (definition.advanceMultipleInjuries === false) return;
    const multiCard = document.createElement('div');
    multiCard.className = 'card';
    const checkboxId = `multi-injuries-${side}`;
    multiCard.innerHTML = `
      <label class="aast-multi-check">
        <input type="checkbox" id="${checkboxId}" ${sideState.multipleInjuries ? 'checked' : ''}>
        Multiple injuries present (advance one grade, up to Grade III)
      </label>
    `;
    multiCard.querySelector(`#${checkboxId}`).addEventListener('change', (e) => {
      sideState.multipleInjuries = e.target.checked;
      update();
    });
    stepContainer.appendChild(multiCard);
  }

  function update() {
    const result = computeKidneyData(formState, definition);
    badgeGrade.textContent = result.gradeLabel;
    badgeGrade.dataset.level = result.gradeLevel;
    updateReport();
  }

  function updateReport() {
    const data = computeKidneyData(formState, definition);
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

  // Parse-to-autofill with laterality segmentation.
  // - Bilateral paste → splits right/left, switches tool to bilateral mode
  // - Single-side paste → routes to that side, sets laterality
  // - Ungrouped text (no laterality markers) → routes to the currently-
  //   selected side (or right if in bilateral mode)
  const parseBtn = document.getElementById('parse-btn');
  const parseInput = document.getElementById('parse-input');
  const parseStatus = document.getElementById('parse-status');

  function applyParsedToSide(side, parsedFormState) {
    // parseFindings returns selectedFindings as an array; our sideState
    // uses a Set. Normalize on the way in and replace the existing Set
    // (replace semantics match the old single-side parse behavior).
    // A side that is named with no findings ("The right kidney is normal.")
    // is cleared, so findings from an earlier parse do not linger.
    formState[side].selectedFindings = new Set(parsedFormState.selectedFindings || []);
    if ('multipleInjuries' in parsedFormState) {
      formState[side].multipleInjuries = !!parsedFormState.multipleInjuries;
    }
  }

  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;

    const { segments, ungrouped, unmatchedSentences } = parseSegmentedFindings(text, definition);

    // Phase 1.1: parseSegmentedFindings with type 'laterality' returns only
    // 'right' and 'left' segments (bilateral sentences are already expanded
    // to both sides by the segmenter). No 'bilateral' branch needed.
    const sidesTouched = new Set();

    for (const seg of segments) {
      if (seg.key !== 'right' && seg.key !== 'left') continue;
      applyParsedToSide(seg.key, seg.formState);
      if ((seg.formState.selectedFindings || []).length) sidesTouched.add(seg.key);
    }

    // No laterality markers anywhere → apply ungrouped to currently-active side
    // (right by default in bilateral mode).
    if (segments.length === 0 && ungrouped.formState && Object.keys(ungrouped.formState).length > 0) {
      const targetSide = formState.laterality === 'left' ? 'left' : 'right';
      applyParsedToSide(targetSide, ungrouped.formState);
      sidesTouched.add(targetSide);
    }

    // Switch laterality to match what we parsed
    if (sidesTouched.has('right') && sidesTouched.has('left')) {
      formState.laterality = 'bilateral';
    } else if (sidesTouched.has('right')) {
      formState.laterality = 'right';
    } else if (sidesTouched.has('left')) {
      formState.laterality = 'left';
    }

    // Additional Findings gets whole sentences that produced zero matches —
    // report headers ("CT abdomen and pelvis"), negative findings ("the
    // contralateral kidney is otherwise unremarkable"), free-text
    // observations the parser has no rule for. This avoids dumping the
    // word-fragment garbage that older per-segment remainders produced.
    //
    // If the parser didn't match ANYTHING in the whole input, fall through
    // to the raw text so nothing is lost.
    let additional = '';
    if (sidesTouched.size > 0) {
      additional = unmatchedSentences.join(' ');
    } else {
      additional = text;
    }
    additionalFindingsEl.value = additional;
    studyAdditionalFindings = additionalFindingsEl.value;

    buildUI();

    // Status message reflects what actually happened
    const totalMatched = segments.reduce((n, s) => n + s.matched.length, 0) + ungrouped.matched.length;
    const routingParts = [];
    if (sidesTouched.has('right')) routingParts.push('right');
    if (sidesTouched.has('left')) routingParts.push('left');
    const routing = routingParts.length === 2 ? 'both sides' : routingParts[0] || 'active side';
    parseStatus.textContent = `Matched ${totalMatched} finding(s) to ${routing}${additional ? ' -- remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
