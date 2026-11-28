import '../../styles/base.css';
import '../../styles/forms.css';
import '../aast-liver/aast-liver.css';
import './aast-multi.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { aastMultiDefinition, organs } from './definition.js';
import { calculateAast } from '../aast-liver/calculator.js';
import { buildMultiTraumaTemplates } from './templates.js';
import { trackEvent, getStored, setStored } from '../../core/storage.js';
import { getKidneyDefinition, KIDNEY_SCALES, KIDNEY_SCALE_STORAGE_KEY, DEFAULT_KIDNEY_SCALE } from '../aast-kidney/scales.js';
import { parseFindings } from '../../core/parser.js';
import '../../core/tool-name.js';

const templates = buildMultiTraumaTemplates();

function init() {
  trackEvent('tool:aast-multi:opens');

  const organsContainer = document.getElementById('organs-container');
  const badgeRow = document.getElementById('badge-row');
  const reportEl = document.querySelector('report-output');
  const additionalFindingsEl = document.getElementById('additional-findings');

  reportEl.toolId = aastMultiDefinition.id;
  reportEl.definition = aastMultiDefinition;
  reportEl.setTemplates(templates);

  // Per-organ state
  // Kidney follows the stored 2018/2025 choice shared with the kidney tool.
  const storedKidneyDef = getKidneyDefinition(getStored(KIDNEY_SCALE_STORAGE_KEY, DEFAULT_KIDNEY_SCALE));
  const organStates = organs.map((def) => ({
    definition: def.id === 'aast-kidney' ? storedKidneyDef : def,
    formState: { selectedFindings: new Set(), multipleInjuries: false },
    enabled: false,
  }));
  let studyAdditionalFindings = '';

  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  // Build badge row — one badge per organ
  for (const os of organStates) {
    const badge = document.createElement('div');
    badge.className = 'summary-badge summary-badge--level';
    badge.innerHTML = `
      <span class="summary-badge__label">${os.definition.organ}</span>
      <span class="summary-badge__value" data-level="0">--</span>
    `;
    os.badgeEl = badge.querySelector('.summary-badge__value');
    badgeRow.appendChild(badge);
  }

  function buildUI() {
    organsContainer.innerHTML = '';

    for (const os of organStates) {
      const section = document.createElement('div');
      section.className = `organ-section card${os.enabled ? ' organ-section--active' : ''}`;

      // Header with organ name + toggle
      const header = document.createElement('div');
      header.className = 'organ-section__header';
      header.innerHTML = `
        <label class="organ-section__toggle">
          <input type="checkbox" ${os.enabled ? 'checked' : ''}>
          <span class="organ-section__name">${os.definition.organ}</span>
        </label>
      `;
      header.querySelector('input').addEventListener('change', (e) => {
        os.enabled = e.target.checked;
        section.classList.toggle('organ-section--active', os.enabled);
        if (!os.enabled) {
          os.formState.selectedFindings.clear();
          os.formState.multipleInjuries = false;
        }
        rebuildOrganBody(os, section);
        update();
      });
      section.appendChild(header);

      // Body — findings (shown only when enabled)
      const body = document.createElement('div');
      body.className = 'organ-section__body';
      section.appendChild(body);
      os._bodyEl = body;

      if (os.enabled) {
        buildOrganBody(os, body);
      }

      organsContainer.appendChild(section);
    }

    update();
  }

  function rebuildOrganBody(os, section) {
    const body = section.querySelector('.organ-section__body');
    body.innerHTML = '';
    if (os.enabled) {
      buildOrganBody(os, body);
    }
  }

  function buildOrganBody(os, body) {
    if (os.definition.id === 'aast-kidney') body.appendChild(buildKidneyScaleTabs(os));
    for (const cat of os.definition.categories) {
      const catEl = document.createElement('div');
      catEl.className = 'organ-section__category';
      catEl.innerHTML = `
        <div class="step-card__question">${cat.label}</div>
        <div class="aast-category">
          ${cat.findings.map((f) => `
            <button class="benign-choice ${os.formState.selectedFindings.has(f.id) ? 'benign-choice--active' : ''}"
              data-finding="${f.id}" title="Grade ${['', 'I', 'II', 'III', 'IV', 'V'][f.grade]}${f.subgrade ? `-${f.subgrade}` : ''}${f.title ? `. ${f.title}` : ''}">${f.label}</button>
          `).join('')}
        </div>
      `;

      catEl.querySelectorAll('.benign-choice').forEach((btn) => {
        btn.addEventListener('click', () => {
          const fid = btn.dataset.finding;
          if (os.formState.selectedFindings.has(fid)) {
            os.formState.selectedFindings.delete(fid);
            btn.classList.remove('benign-choice--active');
          } else {
            os.formState.selectedFindings.add(fid);
            btn.classList.add('benign-choice--active');
          }
          update();
        });
      });

      body.appendChild(catEl);
    }

    // Multiple injuries checkbox -- only for scales that still advance
    // multiple Grade I/II injuries (not pancreas 2024 / kidney 2025).
    if (os.definition.advanceMultipleInjuries === false) return;
    const multiLabel = document.createElement('label');
    multiLabel.className = 'aast-multi-check';
    multiLabel.innerHTML = `
      <input type="checkbox" ${os.formState.multipleInjuries ? 'checked' : ''}>
      Multiple injuries present (advance one grade, up to Grade III)
    `;
    multiLabel.querySelector('input').addEventListener('change', (e) => {
      os.formState.multipleInjuries = e.target.checked;
      update();
    });
    body.appendChild(multiLabel);
  }

  function update() {
    // Calculate each organ
    for (const os of organStates) {
      if (os.enabled) {
        os.result = calculateAast(os.formState, os.definition);
      } else {
        os.result = null;
      }
      const label = os.result ? os.result.gradeLabel : '--';
      const level = os.result ? os.result.gradeLevel : 0;
      os.badgeEl.textContent = label;
      os.badgeEl.dataset.level = level;
    }
    updateReport();
  }

  function updateReport() {
    const activeOrgans = organStates.filter((os) => os.enabled && os.result);

    reportEl.renderFn = (config) => {
      if (config.editorContent) {
        const combined = {};
        for (const os of activeOrgans) {
          for (const [k, v] of Object.entries(os.result)) {
            combined[`${os.definition.organ.toLowerCase()}_${k}`] = v;
          }
        }
        combined.impressionText = buildImpression(activeOrgans);
        let text = renderEditorContent(config.editorContent, config.pillStates, combined);
        if (studyAdditionalFindings.trim()) {
          text += '\n\n' + (config.sectionHeaders?.additionalFindings ?? 'Other findings:') + '\n' + studyAdditionalFindings.trim();
        }
        return text;
      }

      const headers = config.sectionHeaders || {};
      const sections = [];

      // Findings — one sub-section per enabled organ
      if (activeOrgans.length > 0) {
        const findingsLines = activeOrgans.map((os) => {
          const r = os.result;
          let text = `${os.definition.organ}: AAST${scaleSuffix(r)} ${r.gradeLabel}`;
          if (r.findingsProvided) text += '\n' + r.findingsText;
          return text;
        });
        sections.push((headers.findings ?? 'FINDINGS:') + '\n' + findingsLines.join('\n\n'));
      } else {
        sections.push((headers.findings ?? 'FINDINGS:') + '\nNo organ injuries assessed.');
      }

      // Custom blocks
      if ((config.customBlocks || []).length > 0) {
        sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      }

      // Additional findings
      const otherFindings = studyAdditionalFindings.trim() || 'None.';
      sections.push((headers.additionalFindings ?? 'Other findings:') + '\n' + otherFindings);

      // Impression
      if (config.impression?.enabled) {
        const impressionText = buildImpression(activeOrgans) + (config._impressionSuffix || '');
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + impressionText);
      }

      return sections.join('\n\n');
    };

    const primaryData = activeOrgans.length > 0
      ? { ...activeOrgans[0].result, impressionText: buildImpression(activeOrgans) }
      : { gradeLabel: '--', gradeLevel: 0, impressionText: 'No organ injuries assessed.' };
    reportEl.updateReport(primaryData);
  }

  // 2018 / 2025 kidney scale switch inside the kidney section.
  function buildKidneyScaleTabs(os) {
    const bar = document.createElement('div');
    bar.className = 'mode-tabs-bar';
    for (const s of KIDNEY_SCALES) {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${os.definition === s.definition ? 'active' : ''}`;
      tab.textContent = s.label;
      tab.addEventListener('click', () => {
        if (os.definition === s.definition) return;
        os.definition = s.definition;
        setStored(KIDNEY_SCALE_STORAGE_KEY, s.id);
        // Finding ids differ between scales: start fresh.
        os.formState.selectedFindings.clear();
        os.formState.multipleInjuries = false;
        os._bodyEl.innerHTML = '';
        buildOrganBody(os, os._bodyEl);
        update();
      });
      bar.appendChild(tab);
    }
    return bar;
  }

  // ' (2024 OIS)' when the organ's scale declares a version, else ''.
  function scaleSuffix(result) {
    return result.scaleVersion ? ` (${result.scaleVersion} OIS)` : '';
  }

  function buildImpression(activeOrgans) {
    if (activeOrgans.length === 0) return 'No organ injuries assessed.';
    return activeOrgans
      .map((os) => `AAST ${os.definition.organ} injury${scaleSuffix(os.result)}: ${os.result.gradeLabel}.`)
      .join('\n');
  }

  // Parse
  const parseBtn = document.getElementById('parse-btn');
  const parseInput = document.getElementById('parse-input');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;

    let totalMatched = 0;
    let totalUnmatched = 0;
    let remainder = text;

    // Try parsing against each organ definition
    for (const os of organStates) {
      const { formState: parsed, matched, unmatched, remainder: rem } = parseFindings(remainder, os.definition);
      if (matched.length > 0) {
        os.enabled = true;
        Object.assign(os.formState, parsed);
        os.formState.selectedFindings = new Set(parsed.selectedFindings || []);
        totalMatched += matched.length;
        remainder = rem || '';
      }
      totalUnmatched += unmatched.length;
    }

    additionalFindingsEl.value = remainder;
    studyAdditionalFindings = remainder;
    buildUI();

    const total = totalMatched + totalUnmatched;
    parseStatus.textContent = `Matched ${totalMatched}/${total}${remainder ? ' — remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
