import '../../styles/base.css';
import '../../styles/forms.css';
import './hydronephrosis.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { hydronephrosisDefinition } from './definition.js';
import { calculateHydronephrosis } from './calculator.js';
import { parseSegmentedFindings } from '../../core/parser.js';
import { hydronephrosisTemplates } from './templates.js';
import { getStored, setStored , trackEvent } from '../../core/storage.js';
import '../../core/tool-name.js';

let mode = getStored('mode:hydronephrosis', 'utd-postnatal');

function init() {
  trackEvent('tool:hydronephrosis:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeGrade = document.getElementById('badge-grade');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const modeTabsEl = document.getElementById('mode-tabs');

  reportEl.toolId = hydronephrosisDefinition.id;
  reportEl.definition = hydronephrosisDefinition;
  reportEl.setTemplates(hydronephrosisTemplates);

  // Single-side fields (grade, aprpd) are used when side is 'right' or
  // 'left'. When side is 'bilateral' the per-side fields take over so
  // each kidney can carry its own grade and APRPD measurement.
  const formState = {
    grade: null, side: null, aprpd: null,
    rightGrade: null, leftGrade: null,
    rightAprpd: null, leftAprpd: null,
  };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  const modes = [
    { id: 'utd-postnatal', label: 'UTD Postnatal' },
    { id: 'utd-antenatal', label: 'UTD Antenatal' },
    { id: 'sfu', label: 'SFU' },
  ];

  function renderModeTabs() {
    modeTabsEl.innerHTML = '';
    modes.forEach((m) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${mode === m.id ? 'active' : ''}`;
      tab.textContent = m.label;
      tab.addEventListener('click', () => {
        mode = m.id;
        setStored('mode:hydronephrosis', mode);
        // Grades are mode-specific (UTD uses P1/P2/P3, SFU uses 1-4 etc.)
        // so clear all grade fields when switching modes.
        formState.grade = null;
        formState.rightGrade = null;
        formState.leftGrade = null;
        renderModeTabs();
        buildUI();
      });
      modeTabsEl.appendChild(tab);
    });
  }

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = hydronephrosisDefinition;

    // --- Side selector (always shown, no per-side fields here) ---
    const sideCard = document.createElement('div');
    sideCard.className = 'card';
    sideCard.innerHTML = `
      <div class="input-group">
        <label>Side</label>
        <div class="toggle-group">${def.sideOptions.map((o) => `<button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div>
      </div>
    `;
    sideCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.side = btn.dataset.value;
        buildUI();
      });
    });
    stepContainer.appendChild(sideCard);

    // --- Grade card(s): one in single-side mode, two in bilateral ---
    if (formState.side === 'bilateral') {
      stepContainer.appendChild(buildGradeCard('Right kidney', 'rightGrade', 'rightAprpd'));
      stepContainer.appendChild(buildGradeCard('Left kidney', 'leftGrade', 'leftAprpd'));
    } else {
      stepContainer.appendChild(buildGradeCard(
        `${modes.find((m) => m.id === mode).label} Grade`,
        'grade',
        'aprpd',
      ));
    }

    update();
  }

  /**
   * Build one grade + APRPD card. Used both for single-side mode (where
   * `gradeKey`=`'grade'` / `aprpdKey`=`'aprpd'`) and for each kidney in
   * bilateral mode (where the keys are the side-prefixed variants).
   */
  function buildGradeCard(title, gradeKey, aprpdKey) {
    const def = hydronephrosisDefinition;
    let grades;
    if (mode === 'utd-postnatal') grades = def.utdPostnatal;
    else if (mode === 'utd-antenatal') grades = def.utdAntenatal;
    else grades = def.sfuGrades;

    const card = document.createElement('div');
    card.className = 'step-card card';
    card.innerHTML = `
      <div class="step-card__question">${title}</div>
      <div class="input-group" style="max-width:140px; margin-bottom:var(--space-sm);">
        <label>APRPD (mm)</label>
        <input type="number" class="no-spinner hn-aprpd-input" min="0" step="0.1" value="${formState[aprpdKey] ?? ''}" placeholder="mm">
      </div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${grades.map((g) => `
          <button class="benign-choice ${formState[gradeKey] === g.id ? 'benign-choice--active' : ''}"
            data-grade="${g.id}" style="text-align:left; justify-content:flex-start;">
            ${g.label}<br><span style="font-size:var(--text-xs); color:var(--text-muted);">${g.description}</span>
          </button>
        `).join('')}
      </div>
    `;
    card.querySelector('.hn-aprpd-input').addEventListener('input', (e) => {
      formState[aprpdKey] = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    card.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState[gradeKey] = btn.dataset.grade;
        card.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.grade === formState[gradeKey]));
        update();
      });
    });
    return card;
  }

  function update() {
    const result = calculateHydronephrosis(formState, mode);
    badgeGrade.textContent = result.gradeLabel !== '--' ? result.gradeLabel.replace(/^(UTD |SFU )/, '') : '--';
    badgeGrade.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateHydronephrosis(formState, mode);
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

    // Laterality-aware parse. The segmenter splits sentences by side,
    // then we route each segment's grade / aprpd to the appropriate
    // per-side fields. Bilateral pastes auto-switch the tool to
    // bilateral mode; single-side pastes preserve the old behavior of
    // filling the flat grade / aprpd fields.
    const { segments, ungrouped, unmatchedSentences } = parseSegmentedFindings(text, hydronephrosisDefinition);

    // Reset all grade / aprpd fields before applying (replace semantics).
    formState.grade = null;
    formState.aprpd = null;
    formState.rightGrade = null;
    formState.leftGrade = null;
    formState.rightAprpd = null;
    formState.leftAprpd = null;

    const sidesTouched = new Set();
    for (const seg of segments) {
      if (seg.key === 'right') {
        if (seg.formState.grade) formState.rightGrade = seg.formState.grade;
        if (seg.formState.aprpd != null) formState.rightAprpd = seg.formState.aprpd;
        sidesTouched.add('right');
      } else if (seg.key === 'left') {
        if (seg.formState.grade) formState.leftGrade = seg.formState.grade;
        if (seg.formState.aprpd != null) formState.leftAprpd = seg.formState.aprpd;
        sidesTouched.add('left');
      }
    }

    // Single-side / no-marker paste: fall back to ungrouped and fill
    // the flat fields. Side auto-detection from ungrouped's `side` key
    // sets the tool to right / left mode.
    if (segments.length === 0 && ungrouped.formState && Object.keys(ungrouped.formState).length > 0) {
      if (ungrouped.formState.grade) formState.grade = ungrouped.formState.grade;
      if (ungrouped.formState.aprpd != null) formState.aprpd = ungrouped.formState.aprpd;
      if (ungrouped.formState.side) formState.side = ungrouped.formState.side;
    }

    // Auto-switch side based on segments
    if (sidesTouched.has('right') && sidesTouched.has('left')) {
      formState.side = 'bilateral';
    } else if (sidesTouched.has('right')) {
      formState.side = 'right';
      // Move the parsed right-side values to the flat fields so the
      // single-side UI picks them up.
      formState.grade = formState.rightGrade;
      formState.aprpd = formState.rightAprpd;
    } else if (sidesTouched.has('left')) {
      formState.side = 'left';
      formState.grade = formState.leftGrade;
      formState.aprpd = formState.leftAprpd;
    }

    // Unmatched sentences go to Additional Findings with the bare-marker
    // filter used across the Phase 2 tools.
    const additional = unmatchedSentences
      .filter((s) => !/^\s*(?:\(\d+\)|\d+\.?)\s*$/.test(s))
      .join(' ');
    additionalFindingsEl.value = additional;
    studyAdditionalFindings = additionalFindingsEl.value;

    buildUI();

    const totalMatched = segments.reduce((n, s) => n + s.matched.length, 0)
      + (segments.length === 0 ? ungrouped.matched.length : 0);
    const routingParts = [];
    if (sidesTouched.has('right')) routingParts.push('right');
    if (sidesTouched.has('left')) routingParts.push('left');
    const routing = routingParts.length === 2 ? 'both sides' : routingParts[0] || 'active side';
    parseStatus.textContent = `Matched ${totalMatched} field(s) to ${routing}${unmatchedSentences.length ? ' \u2014 remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });
  renderModeTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
