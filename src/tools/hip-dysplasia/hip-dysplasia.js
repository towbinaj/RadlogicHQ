import '../../styles/base.css';
import '../../styles/forms.css';
import './hip-dysplasia.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { hipDysplasiaDefinition } from './definition.js';
import { calculateHipDysplasia } from './calculator.js';
import { hipDysplasiaTemplates } from './templates.js';
import { getStored, setStored , trackEvent } from '../../core/storage.js';
import { parseSegmentedFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

let mode = getStored('mode:hip-dysplasia', 'graf');

function init() {
  trackEvent('tool:hip-dysplasia:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeType = document.getElementById('badge-type');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const modeTabsEl = document.getElementById('mode-tabs');

  reportEl.toolId = hipDysplasiaDefinition.id;
  reportEl.definition = hipDysplasiaDefinition;
  reportEl.setTemplates(hipDysplasiaTemplates);

  // Single-side fields (grade, alpha, beta) are used when side is
  // 'right' or 'left'. In bilateral mode the per-side fields take
  // over so each hip carries its own grade + Graf angles.
  const formState = {
    grade: null, side: null, alpha: null, beta: null,
    rightGrade: null, leftGrade: null,
    rightAlpha: null, leftAlpha: null,
    rightBeta: null, leftBeta: null,
  };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function renderModeTabs() {
    modeTabsEl.innerHTML = '';
    [{ id: 'graf', label: 'Graf' }, { id: 'aaos', label: 'AAOS' }].forEach((m) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${mode === m.id ? 'active' : ''}`;
      tab.textContent = m.label;
      tab.addEventListener('click', () => {
        mode = m.id;
        setStored('mode:hip-dysplasia', mode);
        // Grades are mode-specific (Graf types vs AAOS categories)
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

    // --- Side selector (angles moved into per-side cards below) ---
    const sideCard = document.createElement('div');
    sideCard.className = 'card';
    sideCard.innerHTML = `
      <div class="input-group">
        <label>Side</label>
        <div class="toggle-group">${hipDysplasiaDefinition.sideOptions.map((o) => `<button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div>
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
      stepContainer.appendChild(buildGradeCard('Right hip', 'rightGrade', 'rightAlpha', 'rightBeta'));
      stepContainer.appendChild(buildGradeCard('Left hip', 'leftGrade', 'leftAlpha', 'leftBeta'));
    } else {
      stepContainer.appendChild(buildGradeCard(
        mode === 'graf' ? 'Graf Type' : 'AAOS Classification',
        'grade', 'alpha', 'beta',
      ));
    }

    update();
  }

  /**
   * Build one grade + angles card. Used both for single-side mode
   * (`gradeKey`='grade', `alphaKey`='alpha', `betaKey`='beta') and
   * for each hip in bilateral mode (side-prefixed keys).
   */
  function buildGradeCard(title, gradeKey, alphaKey, betaKey) {
    const grades = mode === 'graf' ? hipDysplasiaDefinition.grafTypes : hipDysplasiaDefinition.aaosCategories;
    const card = document.createElement('div');
    card.className = 'step-card card';

    const angleHtml = mode === 'graf' ? `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap; margin-bottom:var(--space-sm);">
        <div class="input-group" style="max-width:100px;"><label>Alpha \u00b0</label><input type="number" class="no-spinner hd-alpha-input" min="0" max="90" step="0.1" value="${formState[alphaKey] ?? ''}" placeholder="\u00b0"></div>
        <div class="input-group" style="max-width:100px;"><label>Beta \u00b0</label><input type="number" class="no-spinner hd-beta-input" min="0" max="90" step="0.1" value="${formState[betaKey] ?? ''}" placeholder="\u00b0"></div>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="step-card__question">${title}</div>
      ${angleHtml}
      <div class="hd-grade-grid">${grades.map((g) => `<button class="benign-choice hd-grade-btn ${formState[gradeKey] === g.id ? 'benign-choice--active' : ''}" data-grade="${g.id}">${g.image ? `<img class="hd-option-img" src="${g.image}" alt="${g.label}">` : ''}<span class="hd-grade-label">${g.label}</span><span style="font-size:var(--text-xs); color:var(--text-muted);">${g.description}</span></button>`).join('')}</div>
    `;

    if (mode === 'graf') {
      card.querySelector('.hd-alpha-input')?.addEventListener('input', (e) => {
        formState[alphaKey] = e.target.value !== '' ? parseFloat(e.target.value) : null;
        update();
      });
      card.querySelector('.hd-beta-input')?.addEventListener('input', (e) => {
        formState[betaKey] = e.target.value !== '' ? parseFloat(e.target.value) : null;
        update();
      });
    }

    card.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState[gradeKey] = btn.dataset.grade;
        card.querySelectorAll('.benign-choice').forEach((b) => b.classList.toggle('benign-choice--active', b.dataset.grade === formState[gradeKey]));
        update();
      });
    });

    return card;
  }

  function update() { const r = calculateHipDysplasia(formState, mode); badgeType.textContent = r.grade; badgeType.dataset.level = r.level; updateReport(); }

  function updateReport() {
    const data = calculateHipDysplasia(formState, mode);
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

    // Laterality-aware parse. Segmenter splits sentences by side,
    // then we route each segment's grade / alpha / beta to the
    // per-side fields. Single-side pastes fall through to the
    // ungrouped bucket and fill the flat fields.
    const { segments, ungrouped, unmatchedSentences } = parseSegmentedFindings(text, hipDysplasiaDefinition);

    // Reset all grade / angle fields before applying.
    formState.grade = null;
    formState.alpha = null;
    formState.beta = null;
    formState.rightGrade = null;
    formState.leftGrade = null;
    formState.rightAlpha = null;
    formState.leftAlpha = null;
    formState.rightBeta = null;
    formState.leftBeta = null;

    const sidesTouched = new Set();
    for (const seg of segments) {
      if (seg.key === 'right') {
        if (seg.formState.grade) formState.rightGrade = seg.formState.grade;
        if (seg.formState.alpha != null) formState.rightAlpha = seg.formState.alpha;
        if (seg.formState.beta != null) formState.rightBeta = seg.formState.beta;
        sidesTouched.add('right');
      } else if (seg.key === 'left') {
        if (seg.formState.grade) formState.leftGrade = seg.formState.grade;
        if (seg.formState.alpha != null) formState.leftAlpha = seg.formState.alpha;
        if (seg.formState.beta != null) formState.leftBeta = seg.formState.beta;
        sidesTouched.add('left');
      }
    }

    // Single-side / no-marker: fall back to ungrouped.
    if (segments.length === 0 && ungrouped.formState && Object.keys(ungrouped.formState).length > 0) {
      if (ungrouped.formState.grade) formState.grade = ungrouped.formState.grade;
      if (ungrouped.formState.alpha != null) formState.alpha = ungrouped.formState.alpha;
      if (ungrouped.formState.beta != null) formState.beta = ungrouped.formState.beta;
      if (ungrouped.formState.side) formState.side = ungrouped.formState.side;
    }

    // Auto-switch side based on segments.
    if (sidesTouched.has('right') && sidesTouched.has('left')) {
      formState.side = 'bilateral';
    } else if (sidesTouched.has('right')) {
      formState.side = 'right';
      formState.grade = formState.rightGrade;
      formState.alpha = formState.rightAlpha;
      formState.beta = formState.rightBeta;
    } else if (sidesTouched.has('left')) {
      formState.side = 'left';
      formState.grade = formState.leftGrade;
      formState.alpha = formState.leftAlpha;
      formState.beta = formState.leftBeta;
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
  renderModeTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
