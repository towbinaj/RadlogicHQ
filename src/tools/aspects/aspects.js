import '../../styles/base.css';
import '../../styles/forms.css';
import './aspects.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { aspectsDefinition } from './definition.js';
import { calculateAspects } from './calculator.js';
import { aspectsTemplates } from './templates.js';
import { trackEvent } from '../../core/storage.js';
import { parseFindings } from '../../core/parser.js';

function init() {
  trackEvent('tool:aspects:opens');
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const badgeScore = document.getElementById('badge-score');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = aspectsDefinition.id;
  reportEl.definition = aspectsDefinition;
  reportEl.setTemplates(aspectsTemplates);

  const affected = new Set();
  let side = null;
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
          <button class="toggle-group__btn ${side === 'left' ? 'toggle-group__btn--active' : ''}" data-value="left">Left</button>
          <button class="toggle-group__btn ${side === 'right' ? 'toggle-group__btn--active' : ''}" data-value="right">Right</button>
        </div>
      </div>
    `;
    sideCard.querySelectorAll('.toggle-group__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        side = btn.dataset.value;
        sideCard.querySelectorAll('.toggle-group__btn').forEach((b) =>
          b.classList.toggle('toggle-group__btn--active', b === btn));
        update();
      });
    });
    stepContainer.appendChild(sideCard);

    // Region grid — click to mark affected (subtracts from 10)
    const regionCard = document.createElement('div');
    regionCard.className = 'step-card card';
    regionCard.innerHTML = `
      <div class="step-card__question">Regions with early ischemic changes</div>
      <div class="aspects-grid">
        ${aspectsDefinition.regions.map((r) => `
          <button class="benign-choice ${affected.has(r.id) ? 'benign-choice--active' : ''}"
            data-region="${r.id}">${r.label}</button>
        `).join('')}
      </div>
    `;
    regionCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rid = btn.dataset.region;
        if (affected.has(rid)) {
          affected.delete(rid);
          btn.classList.remove('benign-choice--active');
        } else {
          affected.add(rid);
          btn.classList.add('benign-choice--active');
        }
        update();
      });
    });
    stepContainer.appendChild(regionCard);

    update();
  }

  function update() {
    const result = calculateAspects(affected, side);
    badgeScore.textContent = result.scoreLabel;
    badgeScore.dataset.level = result.level;
    updateReport();
  }

  function updateReport() {
    const data = calculateAspects(affected, side);

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
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, aspectsDefinition);
    if (parsed.side) side = parsed.side;
    if (parsed.affected) for (const r of parsed.affected) affected.add(r);
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
