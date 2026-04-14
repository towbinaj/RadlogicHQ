import '../../styles/base.css';
import '../../styles/forms.css';
import './reimers.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { reimersDefinition } from './definition.js';
import { calculateReimers } from './calculator.js';
import { reimersTemplates } from './templates.js';
import { parseSegmentedFindings } from '../../core/parser.js';
import { trackEvent } from '../../core/storage.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:reimers:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const rightDisplay = document.getElementById('reimers-right');
  const leftDisplay = document.getElementById('reimers-left');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = reimersDefinition.id;
  reportEl.definition = reimersDefinition;
  reportEl.setTemplates(reimersTemplates);

  const formState = {};
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = reimersDefinition;

    // Block 1: Right hip measurements
    const rightCard = document.createElement('div');
    rightCard.className = 'card reimers-measure-card';
    rightCard.innerHTML = `
      <div class="step-card__question">Right Hip</div>
      <div class="reimers-inputs">
        <div class="reimers-input-item input-group">
          <label for="input-right-m1">M1 — Uncovered head (mm)</label>
          <input type="number" id="input-right-m1" class="no-spinner" min="0" max="100" step="0.1" placeholder="M1" value="${formState.rightM1 ?? ''}">
        </div>
        <div class="reimers-input-item input-group">
          <label for="input-right-m2">M2 — Head width (mm)</label>
          <input type="number" id="input-right-m2" class="no-spinner" min="0.1" max="100" step="0.1" placeholder="M2" value="${formState.rightM2 ?? ''}">
        </div>
        <div class="reimers-result" id="right-result">
          ${formState.rightM1 != null && formState.rightM2 > 0 ? Math.round((formState.rightM1 / formState.rightM2) * 1000) / 10 + '%' : '—'}
        </div>
      </div>
    `;
    rightCard.querySelector('#input-right-m1').addEventListener('input', (e) => {
      formState.rightM1 = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshResult('right'); update();
    });
    rightCard.querySelector('#input-right-m2').addEventListener('input', (e) => {
      formState.rightM2 = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshResult('right'); update();
    });
    stepContainer.appendChild(rightCard);

    // Block 2: Left hip measurements
    const leftCard = document.createElement('div');
    leftCard.className = 'card reimers-measure-card';
    leftCard.innerHTML = `
      <div class="step-card__question">Left Hip</div>
      <div class="reimers-inputs">
        <div class="reimers-input-item input-group">
          <label for="input-left-m1">M1 — Uncovered head (mm)</label>
          <input type="number" id="input-left-m1" class="no-spinner" min="0" max="100" step="0.1" placeholder="M1" value="${formState.leftM1 ?? ''}">
        </div>
        <div class="reimers-input-item input-group">
          <label for="input-left-m2">M2 — Head width (mm)</label>
          <input type="number" id="input-left-m2" class="no-spinner" min="0.1" max="100" step="0.1" placeholder="M2" value="${formState.leftM2 ?? ''}">
        </div>
        <div class="reimers-result" id="left-result">
          ${formState.leftM1 != null && formState.leftM2 > 0 ? Math.round((formState.leftM1 / formState.leftM2) * 1000) / 10 + '%' : '—'}
        </div>
      </div>
    `;
    leftCard.querySelector('#input-left-m1').addEventListener('input', (e) => {
      formState.leftM1 = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshResult('left'); update();
    });
    leftCard.querySelector('#input-left-m2').addEventListener('input', (e) => {
      formState.leftM2 = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshResult('left'); update();
    });
    stepContainer.appendChild(leftCard);

    // Block 3: Coxa valga
    const valgaCard = document.createElement('div');
    valgaCard.className = 'step-card card';
    valgaCard.innerHTML = `
      <div class="step-card__question">Coxa Valga</div>
      <div class="benign-choices">
        ${def.coxaValgaOptions.map((o) => `
          <button class="benign-choice ${formState.coxaValga === o.id ? 'benign-choice--active' : ''}"
            data-value="${o.id}">${o.label}</button>
        `).join('')}
      </div>
    `;
    valgaCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.coxaValga = btn.dataset.value;
        valgaCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(valgaCard);

    update();
  }

  function refreshResult(side) {
    const m1 = formState[side + 'M1'];
    const m2 = formState[side + 'M2'];
    const el = document.getElementById(side + '-result');
    if (el) {
      el.textContent = (m1 != null && m1 >= 0 && m2 > 0)
        ? Math.round((m1 / m2) * 1000) / 10 + '%'
        : '—';
    }
  }

  function update() {
    const result = calculateReimers(formState);
    rightDisplay.textContent = result.rightPct != null ? result.rightPct + '%' : '--';
    leftDisplay.textContent = result.leftPct != null ? result.leftPct + '%' : '--';
    updateReport();
  }

  function updateReport() {
    const result = calculateReimers(formState);
    const data = { ...result };

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        let text = renderEditorContent(config.editorContent, config.pillStates, data);
        if (studyAdditionalFindings.trim()) {
          text += '\n\n' + (config.sectionHeaders?.additionalFindings ?? 'Other findings:') + '\n' + studyAdditionalFindings.trim();
        }
        return text;
      }

      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];

      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + renderBlocks(blocks, data, false));

      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));

      const otherFindings = studyAdditionalFindings.trim() || 'None.';
      sections.push((headers.additionalFindings ?? 'Other findings:') + '\n' + otherFindings);

      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, data));
      }
      return sections.join('\n\n');
    };
    reportEl.updateReport(data);
  }

  // --- Parse ---
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;

    // Laterality-aware parse. The segmenter splits sentences by side;
    // each side's m1 / m2 extraction routes to rightM1/rightM2 or
    // leftM1/leftM2. Coxa valga is study-level (not per-side) so we
    // collect it from any segment or ungrouped.
    const { segments, ungrouped, unmatchedSentences } = parseSegmentedFindings(text, reimersDefinition);

    // Replace semantics: clear all fields before applying.
    for (const key of Object.keys(formState)) delete formState[key];

    let matchedFieldCount = 0;

    for (const seg of segments) {
      if (seg.key === 'right') {
        if (seg.formState.m1 != null) formState.rightM1 = seg.formState.m1;
        if (seg.formState.m2 != null) formState.rightM2 = seg.formState.m2;
      } else if (seg.key === 'left') {
        if (seg.formState.m1 != null) formState.leftM1 = seg.formState.m1;
        if (seg.formState.m2 != null) formState.leftM2 = seg.formState.m2;
      }
      matchedFieldCount += seg.matched.length;
    }

    // Study-level fields: coxaValga comes from anywhere it appears.
    for (const src of [...segments.map((s) => s.formState), ungrouped.formState]) {
      if (src && src.coxaValga) { formState.coxaValga = src.coxaValga; break; }
    }

    // No segments? Fall back to ungrouped. A single "M1 8 M2 40"
    // paste with no side marker doesn't have a natural target hip;
    // we don't attempt to infer one -- the user can type the values
    // directly into whichever side they need.
    if (segments.length === 0 && ungrouped.formState) {
      if (ungrouped.formState.coxaValga) formState.coxaValga = ungrouped.formState.coxaValga;
      matchedFieldCount = ungrouped.matched.length;
    }

    const additional = unmatchedSentences
      .filter((s) => !/^\s*(?:\(\d+\)|\d+\.?)\s*$/.test(s))
      .join(' ');
    additionalFindingsEl.value = additional;
    studyAdditionalFindings = additionalFindingsEl.value;

    buildUI();

    parseStatus.textContent = `Matched ${matchedFieldCount} field(s)${unmatchedSentences.length ? ' \u2014 remainder in Other Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
