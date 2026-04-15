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
import { trackEvent } from '../../core/storage.js';
import { parseSegmentedFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:fetal-ventricle:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeWidth = document.getElementById('badge-width');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = fetalVentricleDefinition.id;
  reportEl.definition = fetalVentricleDefinition;
  reportEl.setTemplates(fetalVentricleTemplates);

  // Flat `width` is used in single-side mode. `rightWidth` /
  // `leftWidth` take over when side === 'bilateral'. GA is study-
  // level (one gestational age per exam).
  const formState = {
    width: null, side: null, ga: null,
    rightWidth: null, leftWidth: null,
  };
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => { studyAdditionalFindings = additionalFindingsEl.value; updateReport(); });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Side + GA card (widths moved into per-side cards below so
    // bilateral mode can show two independent atrial widths).
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap; align-items:end;">
        <div class="input-group"><label>Side</label><div class="toggle-group">${fetalVentricleDefinition.sideOptions.map((o) => `<button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}" data-value="${o.id}">${o.label}</button>`).join('')}</div></div>
        <div class="input-group" style="max-width:120px;"><label for="ga-input">GA (weeks)</label><input type="number" id="ga-input" class="no-spinner" min="16" max="40" step="1" value="${formState.ga ?? ''}" placeholder="weeks"></div>
      </div>
    `;
    card.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.side = btn.dataset.value;
        buildUI();
      });
    });
    card.querySelector('#ga-input').addEventListener('input', (e) => {
      formState.ga = e.target.value !== '' ? parseInt(e.target.value) : null;
      update();
    });
    stepContainer.appendChild(card);

    // Width input(s): one in single-side mode, two in bilateral.
    if (formState.side === 'bilateral') {
      stepContainer.appendChild(buildWidthCard('Right lateral ventricle', 'rightWidth'));
      stepContainer.appendChild(buildWidthCard('Left lateral ventricle', 'leftWidth'));
    } else {
      stepContainer.appendChild(buildWidthCard('Atrial width', 'width'));
    }

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

  /**
   * Build one atrial-width input card. Used for both single-side
   * mode (`widthKey`='width') and each lateral ventricle in
   * bilateral mode ('rightWidth' / 'leftWidth').
   */
  function buildWidthCard(title, widthKey) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="input-group" style="max-width:180px;">
        <label>${title} (mm)</label>
        <input type="number" class="no-spinner fv-width-input" min="0" max="50" step="0.1" value="${formState[widthKey] ?? ''}" placeholder="mm">
      </div>
    `;
    card.querySelector('.fv-width-input').addEventListener('input', (e) => {
      formState[widthKey] = e.target.value !== '' ? parseFloat(e.target.value) : null;
      update();
    });
    return card;
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

  const parseBtn = document.getElementById('parse-btn');
  const parseInput = document.getElementById('parse-input');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;

    // Laterality-aware parse. Segmenter splits sentences by side,
    // then we route each segment's first mm measurement to
    // rightWidth / leftWidth. GA is study-level and comes from
    // anywhere it appears.
    const { segments, ungrouped, unmatchedSentences } = parseSegmentedFindings(text, fetalVentricleDefinition);

    // Reset width fields (replace semantics).
    formState.width = null;
    formState.rightWidth = null;
    formState.leftWidth = null;
    formState.ga = null;

    const sidesTouched = new Set();
    for (const seg of segments) {
      if (seg.key === 'right') {
        if (seg.formState.width != null) formState.rightWidth = seg.formState.width;
        sidesTouched.add('right');
      } else if (seg.key === 'left') {
        if (seg.formState.width != null) formState.leftWidth = seg.formState.width;
        sidesTouched.add('left');
      }
    }

    // GA is study-level -- pick from wherever it appears.
    for (const src of [...segments.map((s) => s.formState), ungrouped.formState]) {
      if (src && src.ga != null) { formState.ga = src.ga; break; }
    }

    // Single-side / no-marker fallback.
    if (segments.length === 0 && ungrouped.formState && Object.keys(ungrouped.formState).length > 0) {
      if (ungrouped.formState.width != null) formState.width = ungrouped.formState.width;
      if (ungrouped.formState.side) formState.side = ungrouped.formState.side;

      // Flow-text bilateral fallback. Dictations like "Bilateral
      // ventriculomegaly, right 13 mm, left 12 mm." are one sentence
      // (so the laterality segmenter doesn't split them) but they do
      // contain side-prefixed measurements. Scan the ungrouped text
      // for "right N mm" / "left N mm" patterns so per-side widths
      // still end up in the right tab.
      if (ungrouped.formState.side === 'bilateral') {
        const rMatch = ungrouped.text.match(/\bright[\s:,]*(\d*\.?\d+)\s*mm/i);
        const lMatch = ungrouped.text.match(/\bleft[\s:,]*(\d*\.?\d+)\s*mm/i);
        if (rMatch) formState.rightWidth = parseFloat(rMatch[1]);
        if (lMatch) formState.leftWidth = parseFloat(lMatch[1]);
        // Clear the flat width since we now have proper per-side values
        if (rMatch || lMatch) formState.width = null;
      }
    }

    // Auto-switch side based on segments.
    if (sidesTouched.has('right') && sidesTouched.has('left')) {
      formState.side = 'bilateral';
    } else if (sidesTouched.has('right')) {
      formState.side = 'right';
      formState.width = formState.rightWidth;
    } else if (sidesTouched.has('left')) {
      formState.side = 'left';
      formState.width = formState.leftWidth;
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
}

document.addEventListener('DOMContentLoaded', init);
