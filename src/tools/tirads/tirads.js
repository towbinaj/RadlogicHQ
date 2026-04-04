import '../../styles/base.css';
import '../../styles/forms.css';
import './tirads.css';
import '../../components/report-output.js';
import { renderToolForm } from '../../core/renderer.js';
import { calculateScore } from '../../core/engine.js';
import { renderReport, buildTemplateData } from '../../core/report.js';
import { tiradsDefinition } from './definition.js';
import { calculateTirads } from './calculator.js';
import { tiradsTemplates } from './templates.js';

const formState = {};

function init() {
  const inputContainer = document.getElementById('tool-input');
  const reportEl = document.querySelector('report-output');
  const scoreDisplay = document.getElementById('total-score');
  const levelDisplay = document.getElementById('tirads-level');

  // Set up report output component
  reportEl.toolId = tiradsDefinition.id;
  reportEl.renderFn = renderReport;
  reportEl.setTemplates(tiradsTemplates);

  // Render the form
  renderToolForm(inputContainer, tiradsDefinition, (inputId, value) => {
    formState[inputId] = value;
    update();
  });

  function update() {
    // Calculate section scores + total
    const { sectionScores, totalScore } = calculateScore(
      tiradsDefinition,
      formState
    );

    // Run TI-RADS specific logic
    const sizeCm = formState['nodule-size'] ?? null;
    const tiradsResult = calculateTirads(totalScore, sizeCm);

    // Update score/level display
    scoreDisplay.textContent = totalScore;
    levelDisplay.textContent = tiradsResult.tiradsFullLabel;
    levelDisplay.dataset.level = tiradsResult.tiradsLevel;

    // Build template data and update report
    const templateData = buildTemplateData(
      tiradsDefinition,
      formState,
      tiradsResult
    );

    // Rename echogenic-foci keys to camelCase for templates
    templateData.echogenicFoci = templateData['echogenic-foci'] || 'Not selected';
    templateData.echogenicFociPoints = sectionScores['echogenic-foci'] || 0;
    templateData.echogenicFociSelected = templateData['echogenic-fociSelected'];
    templateData.noduleLocation =
      formState['nodule-location']
        ? tiradsDefinition.additionalInputs
            .find((i) => i.id === 'nodule-location')
            ?.options.find((o) => o.id === formState['nodule-location'])?.label || ''
        : '';
    templateData.noduleLocationProvided = !!formState['nodule-location'];
    templateData.additionalFindings = formState['additional-findings'] || '';
    templateData.additionalFindingsProvided = !!formState['additional-findings'];

    reportEl.updateReport(templateData);
  }

  // Initial render with empty state
  update();
}

document.addEventListener('DOMContentLoaded', init);
