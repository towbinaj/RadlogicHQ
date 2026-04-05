import '../../styles/base.css';
import '../../styles/forms.css';
import './tirads.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderToolForm } from '../../core/renderer.js';
import { calculateScore } from '../../core/engine.js';
import { renderReport, renderBlocks, buildTemplateData } from '../../core/report.js';
import { tiradsDefinition } from './definition.js';
import { calculateTirads } from './calculator.js';
import { tiradsTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';

// Each nodule has its own form state
let nodules = [createNoduleState(1)];
let activeNoduleIndex = 0;

// Store the default section order for reset
const DEFAULT_SECTION_ORDER = tiradsDefinition.sections.map((s) => s.id);

function createNoduleState(num) {
  return { id: num, label: `Nodule ${num}`, formState: {} };
}

function init() {
  const inputContainer = document.getElementById('tool-input');
  const reportEl = document.querySelector('report-output');
  const scoreDisplay = document.getElementById('total-score');
  const levelDisplay = document.getElementById('tirads-level');
  const noduleTabsEl = document.getElementById('nodule-tabs');

  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = tiradsDefinition.id;
  reportEl.setTemplates(tiradsTemplates);

  // Sync: report editor reset → reset form section order
  reportEl.onReset = () => {
    resetSectionOrder();
    renderActiveNodule();
  };

  // Map between block IDs (camelCase) and section IDs (hyphenated)
  const blockToSection = { echogenicFoci: 'echogenic-foci' };
  const sectionToBlock = { 'echogenic-foci': 'echogenicFoci' };

  // Sync: report editor block reorder → reorder form sections
  reportEl.onBlockReorder = (blockIds) => {
    const sectionIds = new Set(tiradsDefinition.sections.map((s) => s.id));
    const newSectionOrder = blockIds
      .map((id) => blockToSection[id] || id)
      .filter((id) => sectionIds.has(id));
    if (newSectionOrder.length > 0) {
      applySectionOrder(newSectionOrder);
      saveSectionOrder();
      renderActiveNodule();
    }
  };

  // Restore compact mode from localStorage
  if (localStorage.getItem('radtools:compact') === '1') {
    document.body.classList.add('compact');
  }

  // Restore saved section order
  const savedOrder = JSON.parse(localStorage.getItem('radtools:sectionOrder:tirads') || 'null');
  if (savedOrder) {
    applySectionOrder(savedOrder);
  }

  function applySectionOrder(order) {
    const byId = new Map(tiradsDefinition.sections.map((s) => [s.id, s]));
    const reordered = order.map((id) => byId.get(id)).filter(Boolean);
    // Append any sections not in the saved order (new ones added later)
    for (const s of tiradsDefinition.sections) {
      if (!order.includes(s.id)) reordered.push(s);
    }
    tiradsDefinition.sections = reordered;
  }

  function saveSectionOrder() {
    localStorage.setItem(
      'radtools:sectionOrder:tirads',
      JSON.stringify(tiradsDefinition.sections.map((s) => s.id))
    );
  }

  function resetSectionOrder() {
    localStorage.removeItem('radtools:sectionOrder:tirads');
    applySectionOrder(DEFAULT_SECTION_ORDER);
  }

  // Study-level additional findings (outside nodule state)
  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  function renderNoduleTabs() {
    noduleTabsEl.innerHTML = '';

    nodules.forEach((nodule, i) => {
      const tab = document.createElement('button');
      tab.className = `nodule-tab ${i === activeNoduleIndex ? 'active' : ''}`;
      tab.textContent = nodule.label;
      tab.addEventListener('click', () => {
        activeNoduleIndex = i;
        renderNoduleTabs();
        renderActiveNodule();
      });

      // Right-click or long-press to rename (context menu)
      tab.addEventListener('dblclick', () => {
        const newLabel = prompt('Rename nodule:', nodule.label);
        if (newLabel && newLabel.trim()) {
          nodule.label = newLabel.trim();
          renderNoduleTabs();
          updateReport();
        }
      });

      noduleTabsEl.appendChild(tab);
    });

    // Add nodule button
    const addBtn = document.createElement('button');
    addBtn.className = 'nodule-tab nodule-tab--add';
    addBtn.textContent = '+';
    addBtn.title = 'Add nodule';
    addBtn.addEventListener('click', () => {
      const num = nodules.length + 1;
      nodules.push(createNoduleState(num));
      activeNoduleIndex = nodules.length - 1;
      renderNoduleTabs();
      renderActiveNodule();
    });
    noduleTabsEl.appendChild(addBtn);

    // Remove button (only if >1 nodule)
    if (nodules.length > 1) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'nodule-tab nodule-tab--remove';
      removeBtn.textContent = '\u2212'; // minus sign
      removeBtn.title = 'Remove current nodule';
      removeBtn.addEventListener('click', () => {
        nodules.splice(activeNoduleIndex, 1);
        if (activeNoduleIndex >= nodules.length) {
          activeNoduleIndex = nodules.length - 1;
        }
        renderNoduleTabs();
        renderActiveNodule();
      });
      noduleTabsEl.appendChild(removeBtn);
    }
  }

  function renderActiveNodule() {
    const nodule = nodules[activeNoduleIndex];
    renderToolForm(inputContainer, tiradsDefinition, (inputId, value) => {
      nodule.formState[inputId] = value;
      update();
    }, {
      onReorder: (newOrder) => {
        saveSectionOrder();
        syncBlockOrder(newOrder);
        update();
      },
    });
    // Restore selections for this nodule if switching back
    restoreFormState(inputContainer, tiradsDefinition, nodule.formState);
    update();
  }

  function syncBlockOrder(sectionOrder) {
    const config = reportEl._getConfig();
    if (!config?.blocks) return;

    // Map section IDs to block IDs (handles echogenic-foci → echogenicFoci)
    const blockOrder = sectionOrder.map((id) => sectionToBlock[id] || id);
    const reorderableSet = new Set(blockOrder);

    const reorderable = blockOrder
      .map((id) => config.blocks.find((b) => b.id === id))
      .filter(Boolean);

    const newBlocks = [];
    let reorderableInserted = false;

    for (let i = 0; i < config.blocks.length; i++) {
      if (reorderableSet.has(config.blocks[i].id)) {
        if (!reorderableInserted) {
          newBlocks.push(...reorderable);
          reorderableInserted = true;
        }
      } else {
        newBlocks.push(config.blocks[i]);
      }
    }

    config.blocks = newBlocks;
    reportEl._saveBlockConfig();
  }

  function update() {
    const nodule = nodules[activeNoduleIndex];
    const { sectionScores, totalScore } = calculateScore(
      tiradsDefinition,
      nodule.formState
    );

    const sizeCm = nodule.formState['nodule-size'] ?? null;
    const tiradsResult = calculateTirads(totalScore, sizeCm);

    scoreDisplay.textContent = totalScore;
    levelDisplay.textContent = tiradsResult.tiradsFullLabel;
    levelDisplay.dataset.level = tiradsResult.tiradsLevel;

    updateReport();
  }

  function updateReport() {
    // Build template data for each nodule
    const allNoduleData = nodules.map((nodule) => {
      const { sectionScores, totalScore } = calculateScore(
        tiradsDefinition,
        nodule.formState
      );
      const sizeCm = nodule.formState['nodule-size'] ?? null;
      const tiradsResult = calculateTirads(totalScore, sizeCm);

      const templateData = buildTemplateData(
        tiradsDefinition,
        nodule.formState,
        tiradsResult
      );

      templateData.echogenicFoci = templateData['echogenic-foci'] || 'Not selected';
      templateData.echogenicFociPoints = sectionScores['echogenic-foci'] || 0;
      templateData.echogenicFociSelected = templateData['echogenic-fociSelected'];
      templateData.noduleLocation = resolveFullLocation(nodule.formState);
      templateData.noduleLocationProvided = !!(nodule.formState['nodule-side']);
      templateData.noduleLabel = nodule.label;

      return templateData;
    });

    // Build impression summaries — one line per nodule with level + recommendation
    const summaryLines = allNoduleData.map((data) => {
      const loc = data.noduleLocationProvided ? `${data.noduleLocation} ` : '';
      const size = data.noduleSizeProvided ? `${data.noduleSize} cm ` : '';
      return `${data.noduleLabel}: ${loc}${size}${data.tiradsFullLabel}. ${data.recommendation}.`;
    });

    // Render: findings per-nodule, additional findings section, then impression
    reportEl.renderFn = (config, _data) => {
      const blocks = config.blocks || [];
      const showPoints = config.showPoints ?? true;
      const headers = config.sectionHeaders || {};
      const sections = [];

      // FINDINGS
      const findingsBlocks = allNoduleData.map((data) =>
        renderBlocks(blocks, data, showPoints)
      );
      const findingsHeader = headers.findings ?? 'FINDINGS:';
      sections.push(
        findingsHeader + '\n' + (nodules.length === 1
          ? findingsBlocks[0]
          : findingsBlocks.join('\n\n'))
      );

      // Custom text blocks
      const customBlocks = config.customBlocks || [];
      if (customBlocks.length > 0) {
        sections.push(customBlocks.map((cb) => cb.text).join('\n'));
      }

      // ADDITIONAL FINDINGS
      if (studyAdditionalFindings.trim()) {
        const addlHeader = headers.additionalFindings ?? 'ADDITIONAL FINDINGS:';
        sections.push(addlHeader + '\n' + studyAdditionalFindings.trim());
      }

      // IMPRESSION
      if (config.impression?.enabled && config.impression?.template) {
        const impHeader = headers.impression ?? 'IMPRESSION:';
        const impressionData = { noduleSummaries: summaryLines.join('\n') };
        sections.push(impHeader + '\n' + renderReport(config.impression.template, impressionData));
      }

      return sections.join('\n\n');
    };

    reportEl.updateReport(allNoduleData[activeNoduleIndex]);
  }

  function resolveFullLocation(formState) {
    if (!formState['nodule-side']) return '';
    const sideInput = tiradsDefinition.primaryInputs.find((i) => i.id === 'nodule-side');
    const side = sideInput?.options.find((o) => o.id === formState['nodule-side']);
    return side?.label || '';
  }

  // Parse findings
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');

  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;

    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, tiradsDefinition);
    const nodule = nodules[activeNoduleIndex];

    // Replace (not merge) the active nodule's form state with parsed values
    nodule.formState = { ...parsed };

    // Replace additional findings with remainder (not append)
    additionalFindingsEl.value = remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;

    // Re-render the form to show selections
    renderActiveNodule();

    // Show status
    const total = matched.length + unmatched.length;
    parseStatus.textContent = `Matched ${matched.length}/${total} fields${remainder ? ' \u2014 remainder added to Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';

    setTimeout(() => {
      parseStatus.textContent = '';
      parseStatus.className = 'parse-panel__status';
    }, 5000);
  });

  renderNoduleTabs();
  renderActiveNodule();
}

/**
 * Restore visual form state when switching between nodule tabs.
 * Re-selects option cards and fills input values from saved formState.
 */
function restoreFormState(container, definition, formState) {
  // Restore scored sections
  for (const section of definition.sections) {
    const value = formState[section.id];
    if (value == null) continue;

    const sectionEl = container.querySelector(
      `[data-section-id="${section.id}"]`
    );
    if (!sectionEl) continue;

    const selected = Array.isArray(value) ? value : [value];
    sectionEl.querySelectorAll('.option-card').forEach((card) => {
      card.classList.toggle(
        'selected',
        selected.includes(card.dataset.optionId)
      );
    });

    // Update points display
    const pointsEl = container.querySelector(
      `[data-points-display="${section.id}"]`
    );
    if (pointsEl) {
      let pts = 0;
      for (const id of selected) {
        const opt = section.options.find((o) => o.id === id);
        if (opt) pts += opt.points ?? 0;
      }
      pointsEl.textContent = `${pts} pt${pts !== 1 ? 's' : ''}`;
      pointsEl.classList.toggle('has-points', pts > 0);
    }
  }

  // Restore primary + additional inputs
  const allInputs = [
    ...(definition.primaryInputs || []),
    ...(definition.additionalInputs || []),
  ];
  for (const input of allInputs) {
    const value = formState[input.id];
    const el = container.querySelector(`#input-${input.id}`);
    if (!el) continue;
    if (value != null) {
      el.value = value;
    } else {
      el.value = '';
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
