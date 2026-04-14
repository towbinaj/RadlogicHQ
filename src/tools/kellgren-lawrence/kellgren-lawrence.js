import '../../styles/base.css';
import '../../styles/forms.css';
import './kellgren-lawrence.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { klDefinition } from './definition.js';
import { calculateKL } from './calculator.js';
import { parseSegmentedFindings } from '../../core/parser.js';
import { klTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { initKeyboardShortcuts } from '../../core/keyboard-shortcuts.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:kellgren-lawrence:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeGrade = document.getElementById('badge-grade');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = klDefinition.id;
  reportEl.definition = klDefinition;
  reportEl.setTemplates(klTemplates);

  // Joint stays study-level (the whole exam is one joint type).
  // The flat `grade` is used in single-side mode; `rightGrade`/
  // `leftGrade` take over when side === 'bilateral'.
  const formState = {
    grade: null, joint: null, side: null,
    rightGrade: null, leftGrade: null,
  };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = klDefinition;

    // Joint + side
    const metaCard = document.createElement('div');
    metaCard.className = 'card';
    metaCard.innerHTML = `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap;">
        <div class="input-group" style="flex:1; min-width:120px;">
          <label>Joint</label>
          <div class="toggle-group">
            ${def.jointOptions.map((o) => `
              <button class="toggle-group__btn ${formState.joint === o.id ? 'toggle-group__btn--active' : ''}"
                data-field="joint" data-value="${o.id}">${o.label}</button>
            `).join('')}
          </div>
        </div>
        <div class="input-group" style="flex:1; min-width:120px;">
          <label>Side</label>
          <div class="toggle-group">
            ${def.sideOptions.map((o) => `
              <button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}"
                data-field="side" data-value="${o.id}">${o.label}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    metaCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.field;
        formState[field] = btn.dataset.value;
        // Side changes toggle between single-card and two-card layouts,
        // so rebuild the whole UI. Joint changes stay in-place.
        if (field === 'side') {
          buildUI();
        } else {
          metaCard.querySelectorAll(`.toggle-group__btn[data-field="${field}"]`).forEach((b) =>
            b.classList.toggle('toggle-group__btn--active', b === btn));
          update();
        }
      });
    });
    stepContainer.appendChild(metaCard);

    // Grade card(s): one in single-side mode, two in bilateral.
    if (formState.side === 'bilateral') {
      stepContainer.appendChild(buildGradeCard('Right knee/joint', 'rightGrade'));
      stepContainer.appendChild(buildGradeCard('Left knee/joint', 'leftGrade'));
    } else {
      stepContainer.appendChild(buildGradeCard('OA Grade', 'grade'));
    }

    update();
  }

  /**
   * Build one grade card. Used both for single-side mode (`gradeKey`
   * ='grade') and for each side in bilateral mode ('rightGrade' /
   * 'leftGrade'). The grade list is the same across all cards.
   */
  function buildGradeCard(title, gradeKey) {
    const def = klDefinition;
    const gradeCard = document.createElement('div');
    gradeCard.className = 'step-card card';
    gradeCard.innerHTML = `
      <div class="step-card__question">${title}</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${def.grades.map((g) => `
          <button class="benign-choice ${formState[gradeKey] === g.id ? 'benign-choice--active' : ''}"
            data-grade="${g.id}" style="text-align:left; justify-content:flex-start;">
            ${g.label}<br><span style="font-size:var(--text-xs); color:var(--text-muted);">${g.findings}</span>
          </button>
        `).join('')}
      </div>
    `;
    gradeCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState[gradeKey] = btn.dataset.grade;
        gradeCard.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.grade === formState[gradeKey]));
        update();
      });
    });
    return gradeCard;
  }

  function update() {
    const result = calculateKL(formState);
    badgeGrade.textContent = result.grade;
    badgeGrade.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateKL(formState);
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

    // Laterality-aware parse. Segmenter splits sentences by side;
    // each side's grade routes to rightGrade / leftGrade. Joint is
    // study-level (one joint type per exam) so we collect it from
    // any segment or ungrouped.
    const { segments, ungrouped, unmatchedSentences } = parseSegmentedFindings(text, klDefinition);

    // Reset grade fields before applying.
    formState.grade = null;
    formState.rightGrade = null;
    formState.leftGrade = null;

    const sidesTouched = new Set();
    for (const seg of segments) {
      if (seg.key === 'right') {
        if (seg.formState.grade) formState.rightGrade = seg.formState.grade;
        sidesTouched.add('right');
      } else if (seg.key === 'left') {
        if (seg.formState.grade) formState.leftGrade = seg.formState.grade;
        sidesTouched.add('left');
      }
    }

    // Study-level: joint comes from anywhere it appears.
    for (const src of [...segments.map((s) => s.formState), ungrouped.formState]) {
      if (src && src.joint) { formState.joint = src.joint; break; }
    }

    // No-segment fallback: apply ungrouped to flat fields (old behavior).
    if (segments.length === 0 && ungrouped.formState && Object.keys(ungrouped.formState).length > 0) {
      if (ungrouped.formState.grade) formState.grade = ungrouped.formState.grade;
      if (ungrouped.formState.side) formState.side = ungrouped.formState.side;
    }

    // Auto-switch side based on segments.
    if (sidesTouched.has('right') && sidesTouched.has('left')) {
      formState.side = 'bilateral';
    } else if (sidesTouched.has('right')) {
      formState.side = 'right';
      formState.grade = formState.rightGrade;
    } else if (sidesTouched.has('left')) {
      formState.side = 'left';
      formState.grade = formState.leftGrade;
    }

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
  buildUI();
  initKeyboardShortcuts({ container: stepContainer });
}

document.addEventListener('DOMContentLoaded', init);
