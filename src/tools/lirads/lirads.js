import '../../styles/base.css';
import '../../styles/forms.css';
import './lirads.css';
import '../../components/report-output.js';
import '../../components/auth-ui.js';
import { renderReport, renderBlocks } from '../../core/report.js';
import { renderEditorContent } from '../../core/pill-editor.js';
import { liradsDefinition } from './definition.js';
import { calculateLirads } from './calculator.js';
import { liradsTemplates } from './templates.js';
import { parseFindings } from '../../core/parser.js';

let observations = [createObsState(1)];
let activeObsIndex = 0;
let sizeUnit = localStorage.getItem('radtools:sizeUnit:lirads') || 'mm';

function createObsState(num) {
  return { id: num, label: `Observation ${num}`, formState: {} };
}

// Convert internal mm value to display value based on current unit
function displaySize(sizeMm) {
  if (sizeMm == null) return '';
  return sizeUnit === 'cm' ? (sizeMm / 10).toFixed(1) : sizeMm;
}

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function init() {
  const stepContainer = document.getElementById('step-container');
  const reportEl = document.querySelector('report-output');
  const categoryDisplay = document.getElementById('lirads-category');
  const additionalFindingsEl = document.getElementById('additional-findings');
  const obsTabsEl = document.getElementById('obs-tabs');

  reportEl.toolId = liradsDefinition.id;
  reportEl.setTemplates(liradsTemplates);

  let studyAdditionalFindings = '';
  additionalFindingsEl.addEventListener('input', () => {
    studyAdditionalFindings = additionalFindingsEl.value;
    updateReport();
  });

  // --- Observation tabs ---
  function renderObsTabs() {
    obsTabsEl.innerHTML = '';
    observations.forEach((obs, i) => {
      const tab = document.createElement('button');
      tab.className = `obs-tab ${i === activeObsIndex ? 'active' : ''}`;
      tab.textContent = obs.label;
      tab.addEventListener('click', () => { activeObsIndex = i; renderObsTabs(); buildUI(); });
      tab.addEventListener('dblclick', () => {
        const n = prompt('Rename:', obs.label);
        if (n?.trim()) { obs.label = n.trim(); renderObsTabs(); updateReport(); }
      });
      obsTabsEl.appendChild(tab);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'obs-tab obs-tab--add';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => {
      observations.push(createObsState(observations.length + 1));
      activeObsIndex = observations.length - 1;
      renderObsTabs(); buildUI();
    });
    obsTabsEl.appendChild(addBtn);
    if (observations.length > 1) {
      const rmBtn = document.createElement('button');
      rmBtn.className = 'obs-tab obs-tab--remove';
      rmBtn.textContent = '\u2212';
      rmBtn.addEventListener('click', () => {
        observations.splice(activeObsIndex, 1);
        if (activeObsIndex >= observations.length) activeObsIndex = observations.length - 1;
        renderObsTabs(); buildUI();
      });
      obsTabsEl.appendChild(rmBtn);
    }
  }

  // --- Build UI ---
  function buildUI() {
    const fs = observations[activeObsIndex].formState;
    stepContainer.innerHTML = '';

    // Block 1: Primary inputs (Segment + Size) — same as TI-RADS layout
    const primaryCard = document.createElement('div');
    primaryCard.className = 'primary-inputs card';
    primaryCard.innerHTML = `
      <div class="primary-input-item input-group">
        <label for="input-location">Couinaud Segment</label>
        <select id="input-location">
          <option value="">Select segment...</option>
          ${liradsDefinition.locationInput.options.map((o) =>
            `<option value="${o.id}" ${fs.location === o.id ? 'selected' : ''}>${o.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="primary-input-item input-group">
        <label for="input-size">Size</label>
        <div class="input-with-unit">
          <input type="number" id="input-size" class="no-spinner" min="${sizeUnit === 'mm' ? '1' : '0.1'}" max="${sizeUnit === 'mm' ? '999' : '99.9'}" step="${sizeUnit === 'mm' ? '1' : '0.1'}" placeholder="${sizeUnit === 'mm' ? 'e.g., 25' : 'e.g., 2.5'}" value="${displaySize(fs.size) ?? ''}">
          <div class="unit-toggle">
            <button class="unit-toggle__btn ${sizeUnit === 'mm' ? 'active' : ''}" data-unit="mm">mm</button>
            <button class="unit-toggle__btn ${sizeUnit === 'cm' ? 'active' : ''}" data-unit="cm">cm</button>
          </div>
        </div>
      </div>
      <div class="primary-input-item primary-input-item--narrow input-group">
        <label for="input-series">Series</label>
        <input type="text" id="input-series" inputmode="numeric" placeholder="#" value="${fs.seriesNumber ?? ''}" class="no-spinner">
      </div>
      <div class="primary-input-item primary-input-item--narrow input-group">
        <label for="input-image">Image</label>
        <input type="text" id="input-image" inputmode="numeric" placeholder="#" value="${fs.imageNumber ?? ''}" class="no-spinner">
      </div>
    `;
    primaryCard.querySelector('#input-location').addEventListener('change', (e) => {
      fs.location = e.target.value || null; update();
    });
    primaryCard.querySelector('#input-size').addEventListener('input', (e) => {
      const raw = e.target.value !== '' ? parseFloat(e.target.value) : null;
      // Always store internally in mm
      fs.size = raw != null ? (sizeUnit === 'cm' ? Math.round(raw * 10) : raw) : null;
      update();
    });
    primaryCard.querySelectorAll('.unit-toggle__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const newUnit = btn.dataset.unit;
        if (newUnit === sizeUnit) return;
        sizeUnit = newUnit;
        localStorage.setItem('radtools:sizeUnit:lirads', sizeUnit);
        // Re-render to update input field with converted value
        buildUI();
      });
    });
    primaryCard.querySelector('#input-series').addEventListener('input', (e) => {
      fs.seriesNumber = e.target.value.trim() || null; update();
    });
    primaryCard.querySelector('#input-image').addEventListener('input', (e) => {
      fs.imageNumber = e.target.value.trim() || null; update();
    });
    stepContainer.appendChild(primaryCard);

    // Block 2: Benign assessment (compact — tooltips only, no gray text)
    const benignCard = document.createElement('div');
    benignCard.className = 'step-card card';
    benignCard.innerHTML = `
      <div class="step-card__question">Is this observation benign?</div>
      <div class="benign-choices">
        <button class="benign-choice ${fs.benignAssessment === 'definitelyBenign' ? 'benign-choice--active' : ''}"
          data-value="definitelyBenign"
          title="Cyst, hemangioma, perfusion alteration, fat deposition/sparing, hypertrophic pseudomass, confluent fibrosis, focal scar">
          Definitely Benign
        </button>
        <button class="benign-choice ${fs.benignAssessment === 'probablyBenign' ? 'benign-choice--active' : ''}"
          data-value="probablyBenign"
          title="Probable cyst, probable hemangioma, angiomyolipoma, FNH, distinctive nodule without malignancy features">
          Probably Benign
        </button>
        <button class="benign-choice ${fs.benignAssessment === 'indeterminate' ? 'benign-choice--active' : ''}"
          data-value="indeterminate"
          title="Cannot confidently categorize as benign or malignant">
          Indeterminate
        </button>
        <button class="benign-choice ${fs.benignAssessment === 'notBenign' ? 'benign-choice--active' : ''}"
          data-value="notBenign"
          title="Proceed to evaluate for HCC features">
          Not Benign
        </button>
      </div>
    `;
    benignCard.querySelectorAll('.benign-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        fs.benignAssessment = btn.dataset.value;
        benignCard.querySelectorAll('.benign-choice').forEach((b) =>
          b.classList.toggle('benign-choice--active', b === btn));
        updateDisabledStates();
        update();
      });
    });
    stepContainer.appendChild(benignCard);

    // Block 3: Major features (APHE, Washout, Capsule, Threshold Growth)
    const majorCard = document.createElement('div');
    majorCard.className = 'step-card card';
    majorCard.id = 'major-features';
    const majorFeatures = liradsDefinition.majorFeatures.filter((f) => f.inputType === 'yes-no');
    majorCard.innerHTML = `
      <div class="step-card__question">Major Features</div>
      ${majorFeatures.map((f) => `
        <div class="major-feature">
          <span class="major-feature__label" ${f.tooltip ? `title="${esc(f.tooltip)}"` : ''}>${f.label}</span>
          <div class="step-card__buttons">
            <button class="step-btn ${fs[f.id] === 'yes' ? 'step-btn--active' : ''}" data-feature="${f.id}" data-value="yes">Present</button>
            <button class="step-btn ${fs[f.id] === 'no' ? 'step-btn--active' : ''}" data-feature="${f.id}" data-value="no">Absent</button>
          </div>
        </div>
      `).join('')}
    `;
    majorCard.querySelectorAll('.step-btn[data-feature]').forEach((btn) => {
      btn.addEventListener('click', () => {
        fs[btn.dataset.feature] = btn.dataset.value;
        majorCard.querySelectorAll(`.step-btn[data-feature="${btn.dataset.feature}"]`).forEach((s) =>
          s.classList.toggle('step-btn--active', s === btn));
        update();
      });
    });
    stepContainer.appendChild(majorCard);

    // Block 4: Ancillary features (includes TIV + LR-M + upgrade/downgrade)
    const anc = liradsDefinition.ancillaryFeatures;
    const ancCard = document.createElement('div');
    ancCard.className = 'step-card card step-card--ancillary';
    ancCard.id = 'ancillary-features';
    ancCard.innerHTML = `
      <div class="step-card__question">Additional & Ancillary Features</div>

        <div class="ancillary-group">
          <h4 class="ancillary-group__title">Special Categories</h4>
          <div class="ancillary-grid">
            <button class="ancillary-card ${fs.tumorInVein === 'yes' ? 'selected' : ''}" data-key="tumorInVein"
              title="Unequivocal enhancing soft tissue in vein lumen">Tumor in Vein (LR-TIV)</button>
            <button class="ancillary-card ${fs.lrmFeatures === 'yes' ? 'selected' : ''}" data-key="lrmFeatures"
              title="Rim APHE, peripheral washout, delayed central enhancement, infiltrative appearance, marked diffusion restriction">Non-HCC Malignancy (LR-M)</button>
          </div>
        </div>

        <div class="ancillary-group">
          <h4 class="ancillary-group__title">Favoring HCC (upgrade)</h4>
          <div class="ancillary-grid">
            ${anc.favoringHCC.map((f) =>
              `<button class="ancillary-card ${fs['anc_hcc_' + f.id] ? 'selected' : ''}" data-key="anc_hcc_${f.id}" ${f.tooltip ? `title="${esc(f.tooltip)}"` : ''}>${f.label}</button>`
            ).join('')}
          </div>
        </div>

        <div class="ancillary-group">
          <h4 class="ancillary-group__title">Favoring Benign (downgrade)</h4>
          <div class="ancillary-grid">
            ${anc.favoringBenign.map((f) =>
              `<button class="ancillary-card ${fs['anc_benign_' + f.id] ? 'selected' : ''}" data-key="anc_benign_${f.id}" ${f.tooltip ? `title="${esc(f.tooltip)}"` : ''}>${f.label}</button>`
            ).join('')}
          </div>
        </div>
    `;

    // TIV and LR-M are toggles (not checkboxes — they map to yes/no)
    ancCard.querySelectorAll('.ancillary-card[data-key="tumorInVein"], .ancillary-card[data-key="lrmFeatures"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        fs[key] = fs[key] === 'yes' ? 'no' : 'yes';
        btn.classList.toggle('selected', fs[key] === 'yes');
        update();
      });
    });

    // Regular ancillary toggles
    ancCard.querySelectorAll('.ancillary-card:not([data-key="tumorInVein"]):not([data-key="lrmFeatures"])').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        fs[key] = !fs[key];
        btn.classList.toggle('selected', fs[key]);
        update();
      });
    });

    stepContainer.appendChild(ancCard);

    updateDisabledStates();
    update();
  }

  function updateDisabledStates() {
    const fs = observations[activeObsIndex].formState;
    const earlyExit = fs.benignAssessment === 'definitelyBenign' || fs.benignAssessment === 'probablyBenign';

    const majorCard = document.getElementById('major-features');
    const ancCard = document.getElementById('ancillary-features');
    if (majorCard) majorCard.classList.toggle('step-card--disabled', earlyExit);
    if (ancCard) ancCard.classList.toggle('step-card--disabled', earlyExit);
  }

  // --- Update ---
  function update() {
    const fs = observations[activeObsIndex].formState;
    if (fs.benignAssessment === 'definitelyBenign') { fs.definitelyBenign = 'yes'; fs.probablyBenign = 'no'; }
    else if (fs.benignAssessment === 'probablyBenign') { fs.definitelyBenign = 'no'; fs.probablyBenign = 'yes'; }
    else { fs.definitelyBenign = 'no'; fs.probablyBenign = 'no'; }

    const result = calculateLirads(fs);
    categoryDisplay.textContent = result.categoryFullLabel;
    categoryDisplay.dataset.level = result.categoryLevel;
    updateReport();
  }

  function updateReport() {
    const allObsData = observations.map((obs) => {
      const fs = { ...obs.formState };
      if (fs.benignAssessment === 'definitelyBenign') { fs.definitelyBenign = 'yes'; fs.probablyBenign = 'no'; }
      else if (fs.benignAssessment === 'probablyBenign') { fs.definitelyBenign = 'no'; fs.probablyBenign = 'yes'; }
      else { fs.definitelyBenign = 'no'; fs.probablyBenign = 'no'; }

      const result = calculateLirads(fs);
      const data = {
        ...result,
        apheLabel: fs.aphe === 'yes' ? 'Present' : fs.aphe === 'no' ? 'Absent' : 'Not assessed',
        washoutLabel: fs.washout === 'yes' ? 'Present' : fs.washout === 'no' ? 'Absent' : 'Not assessed',
        capsuleLabel: fs.capsule === 'yes' ? 'Present' : fs.capsule === 'no' ? 'Absent' : 'Not assessed',
        thresholdGrowthLabel: fs.thresholdGrowth === 'yes' ? 'Present' : fs.thresholdGrowth === 'no' ? 'Absent' : 'Not assessed',
        hasAdjustment: !!result.adjustmentNote,
      };

      // Build observation label with optional (Series #, Image #)
      const refs = [];
      if (fs.seriesNumber) refs.push(`Series ${fs.seriesNumber}`);
      if (fs.imageNumber) refs.push(`Image ${fs.imageNumber}`);
      data.obsLabel = refs.length > 0
        ? `${obs.label} (${refs.join(', ')})`
        : obs.label;
      if (fs.location) {
        const opt = liradsDefinition.locationInput.options.find((o) => o.id === fs.location);
        data.location = opt?.label || '';
        data.locationProvided = true;
      } else { data.location = ''; data.locationProvided = false; }
      return data;
    });

    const summaryLines = allObsData.map((d) => {
      const loc = d.locationProvided ? `${d.location} ` : '';
      const size = d.sizeProvided ? `${d.sizeMm} mm ` : '';
      return `${d.obsLabel}: ${loc}${size}${d.categoryFullLabel}. ${d.management}`;
    });

    reportEl.renderFn = (config, _data) => {
      // Pill editor content path
      if (config.editorContent) {
        if (observations.length === 1) {
          const merged = { ...allObsData[0], impressionSummary: summaryLines.join('\n') };
          let text = renderEditorContent(config.editorContent, config.pillStates, merged);
          if (studyAdditionalFindings.trim()) text += '\n\nADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim();
          return text;
        } else {
          const parts = allObsData.map((data) => renderEditorContent(config.editorContent, config.pillStates, data));
          let text = parts.join('\n\n');
          if (studyAdditionalFindings.trim()) text += '\n\nADDITIONAL FINDINGS:\n' + studyAdditionalFindings.trim();
          text += '\n\nIMPRESSION:\n' + summaryLines.join('\n');
          return text;
        }
      }

      // Fallback: block-based rendering
      const blocks = config.blocks || [];
      const headers = config.sectionHeaders || {};
      const sections = [];

      sections.push((headers.findings ?? 'FINDINGS:') + '\n' + (observations.length === 1
        ? renderBlocks(blocks, allObsData[0], false)
        : allObsData.map((d) => renderBlocks(blocks, d, false)).join('\n\n')));

      if ((config.customBlocks || []).length > 0) sections.push(config.customBlocks.map((cb) => cb.text).join('\n'));
      if (studyAdditionalFindings.trim()) sections.push((headers.additionalFindings ?? 'ADDITIONAL FINDINGS:') + '\n' + studyAdditionalFindings.trim());
      if (config.impression?.enabled && config.impression?.template) {
        sections.push((headers.impression ?? 'IMPRESSION:') + '\n' + renderReport(config.impression.template, { impressionSummary: summaryLines.join('\n') }));
      }

      return sections.join('\n\n');
    };
    reportEl.updateReport(allObsData[activeObsIndex]);
  }

  // --- Parse ---
  const parseInput = document.getElementById('parse-input');
  const parseBtn = document.getElementById('parse-btn');
  const parseStatus = document.getElementById('parse-status');
  parseBtn.addEventListener('click', () => {
    const text = parseInput.value.trim();
    if (!text) return;
    const { formState: parsed, matched, unmatched, remainder } = parseFindings(text, liradsDefinition);
    const fs = observations[activeObsIndex].formState;
    for (const key of Object.keys(fs)) delete fs[key];
    Object.assign(fs, parsed);
    additionalFindingsEl.value = remainder || '';
    studyAdditionalFindings = additionalFindingsEl.value;
    buildUI();
    const total = matched.length + unmatched.length;
    parseStatus.textContent = `Matched ${matched.length}/${total}${remainder ? ' — remainder in Additional Findings' : ''}`;
    parseStatus.className = 'parse-panel__status parse-panel__status--success';
    setTimeout(() => { parseStatus.textContent = ''; parseStatus.className = 'parse-panel__status'; }, 5000);
  });

  renderObsTabs();
  buildUI();
}

document.addEventListener('DOMContentLoaded', init);
