import '../../styles/base.css';
import '../../styles/forms.css';
import './vur.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { vurVcugDefinition } from './definition.js';
import { calculateVurVcug } from './calculator.js';
import { vurVcugTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings, parseSegmentedFindings } from '../../core/parser.js';
import { initKeyboardShortcuts } from '../../core/keyboard-shortcuts.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:vur:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeGrade = document.getElementById('badge-grade');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = vurVcugDefinition.id;
  reportEl.definition = vurVcugDefinition;
  reportEl.setTemplates(vurVcugTemplates);

  const formState = { grade: null, side: null, rightGrade: null, leftGrade: null };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Side selector
    const sideCard = document.createElement('div');
    sideCard.className = 'card';
    sideCard.innerHTML = `<div class="input-group"><label>Side</label><div class="toggle-group">${vurVcugDefinition.sideOptions.map((o) => `<button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>`;
    sideCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.side = btn.dataset.value;
        sideCard.querySelectorAll('.toggle-group__btn').forEach((b) => b.classList.toggle('toggle-group__btn--active', b === btn));
        buildGradeCards();
        update();
      });
    });
    stepContainer.appendChild(sideCard);

    buildGradeCards();
    update();
  }

  function buildGradeCards() {
    // Remove existing grade cards
    stepContainer.querySelectorAll('.vur-grade-card').forEach((el) => el.remove());

    if (formState.side === 'bilateral') {
      // Two separate grade selectors
      stepContainer.appendChild(buildGradeCard('Right', 'rightGrade', formState.rightGrade));
      stepContainer.appendChild(buildGradeCard('Left', 'leftGrade', formState.leftGrade));
    } else {
      // Single grade selector
      stepContainer.appendChild(buildGradeCard('VCUG Grade', 'grade', formState.grade));
    }
  }

  function buildGradeCard(title, field, currentValue) {
    const card = document.createElement('div');
    card.className = 'step-card card vur-grade-card';
    card.innerHTML = `
      <div class="step-card__question">${title}</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
        ${vurVcugDefinition.grades.map((g) => `
          <button class="benign-choice ${currentValue === g.id ? 'benign-choice--active' : ''}"
            data-grade="${g.id}" style="text-align:left; justify-content:flex-start;">${g.label} — ${g.description}</button>
        `).join('')}
      </div>
    `;
    card.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState[field] = btn.dataset.grade;
        card.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.grade === formState[field]));
        update();
      });
    });
    return card;
  }

  function update() {
    const r = calculateVurVcug(formState);
    badgeGrade.textContent = r.grade;
    badgeGrade.dataset.level = r.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateVurVcug(formState);
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
    // Laterality-aware parse. Segmenter splits sentences by side, then we
    // route each segment's `grade` result into rightGrade / leftGrade.
    const { segments, ungrouped, unmatchedSentences } = parseSegmentedFindings(text, vurVcugDefinition);

    // Reset per-side state before applying (replace semantics, matching the
    // old single-call behavior for repeated pastes).
    formState.rightGrade = null;
    formState.leftGrade = null;
    formState.grade = null;

    for (const seg of segments) {
      if (seg.formState.grade) {
        if (seg.key === 'right') formState.rightGrade = seg.formState.grade;
        else if (seg.key === 'left') formState.leftGrade = seg.formState.grade;
      }
    }

    // Fall back to ungrouped (no laterality markers found) for single-side
    // pastes like "grade 3 VUR" — apply to currently-active side.
    if (segments.length === 0 && ungrouped.formState.grade) {
      if (formState.side === 'right') formState.rightGrade = ungrouped.formState.grade;
      else if (formState.side === 'left') formState.leftGrade = ungrouped.formState.grade;
      else formState.grade = ungrouped.formState.grade;
    }

    // Auto-switch side based on what actually matched
    if (formState.rightGrade && formState.leftGrade) {
      formState.side = 'bilateral';
    } else if (formState.rightGrade) {
      formState.side = 'right';
      formState.grade = formState.rightGrade;
    } else if (formState.leftGrade) {
      formState.side = 'left';
      formState.grade = formState.leftGrade;
    }

    additionalFindingsEl.value = unmatchedSentences.join(' ');
    studyAdditionalFindings = additionalFindingsEl.value;
    buildUI();
    const totalMatched = segments.reduce((n, s) => n + s.matched.length, 0);
    parseStatus.textContent = `Matched ${totalMatched} grade(s)${unmatchedSentences.length ? ' -- remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });
  buildUI();
  initKeyboardShortcuts({ container: stepContainer });
}

document.addEventListener('DOMContentLoaded', init);
