import '../../styles/base.css';
import '../../styles/forms.css';
import './nascet.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { nascetDefinition } from './definition.js';
import { calculateCarotid } from './calculator.js';
import { parseFindings } from '../../core/parser.js';
import { nascetTemplates } from './templates.js';
import { trackEvent, getStored, setStored } from '../../core/storage.js';
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

  // modality: 'angio' (CTA / MRA / DSA, NASCET diameters) or 'us' (duplex,
  // SRU velocity criteria). Asked first; the inputs differ.
  const formState = {
    modality: getStored('mode:nascet', 'angio'),
    stenosisDiam: null, distalDiam: null, side: null,
    psv: null, edv: null, ratio: null, plaque: null, flow: null,
  };
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function buildUI() {
    stepContainer.innerHTML = '';

    // Modality (first question) + side
    const sideCard = document.createElement('div');
    sideCard.className = 'card';
    sideCard.innerHTML = `
      <div class="input-group" style="margin-bottom:var(--space-sm);">
        <label title="NASCET diameter method applies to CTA, MRA and catheter angiography; duplex ultrasound uses SRU velocity criteria">Modality</label>
        <div class="toggle-group">
          <button class="toggle-group__btn ${formState.modality !== 'us' ? 'toggle-group__btn--active' : ''}" data-modality="angio">CTA / MRA / DSA</button>
          <button class="toggle-group__btn ${formState.modality === 'us' ? 'toggle-group__btn--active' : ''}" data-modality="us">Duplex US</button>
        </div>
      </div>
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
    sideCard.querySelectorAll('[data-modality]').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.modality = btn.dataset.modality;
        setStored('mode:nascet', formState.modality);
        buildUI();
      });
    });
    sideCard.querySelectorAll('[data-value]').forEach((btn) => {
      btn.addEventListener('click', () => {
        formState.side = btn.dataset.value;
        sideCard.querySelectorAll('[data-value]').forEach((b) =>
          b.classList.toggle('toggle-group__btn--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(sideCard);

    if (formState.modality === 'us') {
      buildUsCard();
      update();
      return;
    }

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

  // Duplex US inputs (SRU consensus): ICA PSV + plaque estimate are primary;
  // ICA/CCA PSV ratio and EDV are additional.
  function buildUsCard() {
    const num = (id, label, val, ph, title) => `
      <div class="input-group" style="flex:1; min-width:120px;">
        <label for="${id}" title="${title}">${label}</label>
        <input type="number" id="${id}" class="no-spinner" min="0" step="0.1" value="${val ?? ''}" placeholder="${ph}">
      </div>`;
    const choice = (key, opts) => opts.map(([id, label, title]) => `
      <button class="toggle-group__btn ${formState[key] === id ? 'toggle-group__btn--active' : ''}" data-key="${key}" data-val="${id}" title="${title || ''}">${label}</button>`).join('');
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="step-card__question">Duplex Ultrasound (SRU criteria)</div>
      <div class="input-group" style="margin-bottom:var(--space-sm);">
        <label>Flow</label>
        <div class="toggle-group">${choice('flow', [['patent', 'Patent'], ['nearOcclusion', 'Near occlusion', 'String sign / markedly narrowed lumen; velocities may be high, low or undetectable'], ['absent', 'No flow', 'No detectable patent lumen']])}</div>
      </div>
      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap;">
        ${num('psv', 'ICA PSV (cm/s)', formState.psv, 'e.g., 180', 'Primary: peak systolic velocity at the stenosis')}
        ${num('edv', 'ICA EDV (cm/s)', formState.edv, 'optional', 'Additional parameter')}
        ${num('ratio', 'ICA/CCA PSV ratio', formState.ratio, 'optional', 'Additional parameter')}
      </div>
      <div class="input-group" style="margin-top:var(--space-sm);">
        <label title="Primary: gray-scale / color estimate of diameter reduction">Plaque estimate</label>
        <div class="toggle-group">${choice('plaque', [['none', 'None visible'], ['lt50', '<50%'], ['ge50', '>=50%']])}</div>
      </div>
    `;
    for (const id of ['psv', 'edv', 'ratio']) {
      card.querySelector('#' + id).addEventListener('input', (e) => {
        formState[id] = e.target.value !== '' ? parseFloat(e.target.value) : null;
        update();
      });
    }
    card.querySelectorAll('[data-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.key;
        formState[k] = formState[k] === btn.dataset.val ? null : btn.dataset.val;
        card.querySelectorAll(`[data-key="${k}"]`).forEach((b) => b.classList.toggle('toggle-group__btn--active', formState[k] === b.dataset.val));
        update();
      });
    });
    stepContainer.appendChild(card);
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
    const result = calculateCarotid(formState);
    badgePct.textContent = result.badgeLabel || result.pctLabel;
    badgePct.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateCarotid(formState);
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
