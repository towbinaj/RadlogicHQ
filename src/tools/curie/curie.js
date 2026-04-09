import '../../styles/base.css';
import '../../styles/forms.css';
import './curie.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { curieDefinition } from './definition.js';
import { calculateMibg } from './calculator.js';
import { curieTemplates, siopenTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';

let mode = localStorage.getItem('radtools:curie:mode') || 'curie';
const curieScores = {};
const siopenScores = {};

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const scoreDisplay = document.getElementById('mibg-score');
  const prognosisDisplay = document.getElementById('mibg-prognosis');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const modeTabsEl = document.getElementById('mode-tabs');

  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function applyTemplates() {
    const tpl = mode === 'siopen' ? siopenTemplates : curieTemplates;
    reportEl.toolId = mode === 'siopen' ? 'curie-siopen' : 'curie';
    reportEl.renderFn = null;
    reportEl.setTemplates(tpl);
  }

  reportEl.definition = curieDefinition;
  applyTemplates();

  // --- Mode tabs ---
  function renderModeTabs() {
    modeTabsEl.innerHTML = '';
    const modes = [
      { id: 'curie', label: 'Curie' },
      { id: 'siopen', label: 'SIOPEN' },
    ];
    modes.forEach((m) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${mode === m.id ? 'active' : ''}`;
      tab.textContent = m.label;
      tab.addEventListener('click', () => {
        mode = m.id;
        localStorage.setItem('radtools:curie:mode', mode);
        applyTemplates();
        renderModeTabs();
        buildUI();
      });
      modeTabsEl.appendChild(tab);
    });
  }

  function buildUI() {
    stepContainer.innerHTML = '';
    const def = curieDefinition;
    const segments = mode === 'siopen' ? def.siopenSegments : def.curieSegments;
    const options = mode === 'siopen' ? def.siopenScoreOptions : def.curieScoreOptions;
    const scores = mode === 'siopen' ? siopenScores : curieScores;

    // Segment scoring table
    const card = document.createElement('div');
    card.className = 'card mibg-card';
    card.innerHTML = `
      <div class="step-card__question">${mode === 'siopen' ? 'SIOPEN' : 'Curie'} Segment Scores</div>
      <table class="mibg-table">
        <thead>
          <tr>
            <th>Segment</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          ${segments.map((seg) => `
            <tr>
              <td class="mibg-table__label">${seg.label}</td>
              <td>
                <div class="mibg-score-btns">
                  ${options.map((o) => `
                    <button class="mibg-score-btn ${scores[seg.id] === o.id ? 'mibg-score-btn--active' : ''}"
                      data-seg="${seg.id}" data-score="${o.id}" title="${esc(o.tooltip)}">${o.label}</button>
                  `).join('')}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    card.querySelectorAll('.mibg-score-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const seg = btn.dataset.seg;
        const score = btn.dataset.score;
        // Toggle: click same score to deselect
        if (scores[seg] === score) {
          delete scores[seg];
        } else {
          scores[seg] = score;
        }
        // Update button states in this row
        card.querySelectorAll(`.mibg-score-btn[data-seg="${seg}"]`).forEach((b) =>
          b.classList.toggle('mibg-score-btn--active', b.dataset.score === scores[seg]));
        update();
      });
    });

    stepContainer.appendChild(card);
    update();
  }

  function update() {
    const scores = mode === 'siopen' ? siopenScores : curieScores;
    const result = calculateMibg(scores, mode);

    scoreDisplay.textContent = result.totalLabel;
    scoreDisplay.dataset.level = result.level;

    if (result.allAssessed) {
      prognosisDisplay.textContent = result.favorable ? 'Favorable' : 'Unfavorable';
      prognosisDisplay.style.color = result.favorable ? 'var(--success)' : 'var(--danger)';
    } else {
      prognosisDisplay.textContent = `${result.assessed}/${result.segmentCount} assessed`;
      prognosisDisplay.style.color = '';
    }

    updateReport();
  }

  function updateReport() {
    const scores = mode === 'siopen' ? siopenScores : curieScores;
    const result = calculateMibg(scores, mode);
    const data = { ...result };

    // Build segment score text
    const lines = result.segmentDetails
      .filter((s) => s.score != null)
      .map((s) => `${s.label}: ${s.score}`);
    data.segmentScoreText = lines.length > 0 ? lines.join('\n') : 'No segments scored';

    const impressionSummary = result.allAssessed
      ? `${result.modeLabel} score: ${result.total}/${result.maxTotal}. ${result.interpretation}.`
      : `${result.modeLabel} score: ${result.total ?? 0}/${result.maxTotal} (${result.assessed}/${result.segmentCount} segments assessed).`;

    reportEl.renderFn = (config, _data) => {
      if (config.editorContent) {
        let text = renderEditorContent(config.editorContent, config.pillStates, { ...data, impressionSummary });
        if (studyAdditionalFindings.trim()) {
          text += '\n\nADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim();
        }
        return text;
      }

      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];

      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + renderBlocks(blocks, data, false));
      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      if (studyAdditionalFindings.trim()) sections.push((headers.additionalFindings ?? 'ADDITIONAL FINDINGS:') + '\n' + studyAdditionalFindings.trim());
      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, { impressionSummary }));
      }
      return sections.join('\n\n');
    };
    reportEl.updateReport(data);
  }

  // Parse
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const scores = mode === 'siopen' ? siopenScores : curieScores;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, curieDefinition);
    for (const key of Object.keys(scores)) delete scores[key];
    Object.assign(scores, parsed);
    additionalFindingsEl.value = remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;
    buildUI();
    const total = matched.length + unmatched.length;
    parseStatus.textContent = `Matched ${matched.length}/${total}${remainder ? ' — remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  renderModeTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
