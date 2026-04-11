import '../../styles/base.css';
import '../../styles/forms.css';
import './nascet.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { nascetDefinition } from './definition.js';
import { calculateNascet } from './calculator.js';
import { parseFindings } from '../../core/parser.js';
import { nascetTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import '../../core/tool-name.js';

function init() {
  trackEvent('tool:nascet:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgePct = document.getElementById('badge-pct');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = nascetDefinition.id;
  reportEl.definition = nascetDefinition;
  reportEl.setTemplates(nascetTemplates);

  const formState = { stenosisDiam: null, distalDiam: null, side: null };
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Side selector
    const sideCard = document.createElement('div');
    sideCard.className = 'card';
    sideCard.innerHTML = `
      <div class="input-group">
        <label>Side</label>
        <div class="toggle-group">
          ${nascetDefinition.sideOptions.map((o) => `
            <button class="toggle-group__btn ${formState.side === o.id ? 'toggle-group__btn--active' : ''}"
              data-value="${o.id}">${o.label}</button>
          `).join('')}
        </div>
      </div>
    `;
    sideCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.side = btn.dataset.value;
        sideCard.querySelectorAll('.toggle-group__btn').forEach((b) =>
          b.classList.toggle('toggle-group__btn--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(sideCard);

    // Measurements
    const measCard = document.createElement('div');
    measCard.className = 'card';
    measCard.innerHTML = `
      <div class="step-card__question">ICA Measurements (mm)</div>
      <div style="display:flex; gap:var(--space-sm); align-items:end; flex-wrap:wrap;">
        <div class="input-group" style="flex:1; min-width:140px;">
          <label for="stenosis-diam">Stenosis diameter</label>
          <input type="number" id="stenosis-diam" class="no-spinner" min="0" step="0.1" value="${formState.stenosisDiam ?? ''}" placeholder="Narrowest point">
        </div>
        <div class="input-group" style="flex:1; min-width:140px;">
          <label for="distal-diam">Distal ICA diameter</label>
          <input type="number" id="distal-diam" class="no-spinner" min="0.1" step="0.1" value="${formState.distalDiam ?? ''}" placeholder="Normal distal ICA">
        </div>
        <div class="nascet-result" id="nascet-result">—</div>
      </div>
    `;
    measCard.querySelector('#stenosis-diam').addEventListener('input', (e) => {
      formState.stenosisDiam = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshResult();
      update();
    });
    measCard.querySelector('#distal-diam').addEventListener('input', (e) => {
      formState.distalDiam = e.target.value !== '' ? parseFloat(e.target.value) : null;
      refreshResult();
      update();
    });
    stepContainer.appendChild(measCard);

    refreshResult();
    update();
  }

  function refreshResult() {
    const el = document.getElementById('nascet-result');
    if (!el) return;
    const { stenosisDiam, distalDiam } = formState;
    if (stenosisDiam != null && distalDiam > 0) {
      const pct = Math.round((1 - stenosisDiam / distalDiam) * 1000) / 10;
      el.textContent = `${pct}%`;
    } else {
      el.textContent = '—';
    }
  }

  function update() {
    const result = calculateNascet(formState);
    badgePct.textContent = result.pctLabel;
    badgePct.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateNascet(formState);
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

  const parseBtn = document.getElementById('parse-btn');
  const parseInput = document.getElementById('parse-input');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, nascetDefinition);
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
}

document.addEventListener('DOMContentLoaded', init);
