/**
 * AAST organ injury grade calculator.
 * Shared logic for both liver and spleen — pass in the definition.
 *
 * Rules:
 *   1. Grade = highest grade among all selected findings.
 *   2. Multiple Grade I/II injuries → advance to Grade III.
 */

const GRADE_LABELS = {
  1: 'Grade I',
  2: 'Grade II',
  3: 'Grade III',
  4: 'Grade IV',
  5: 'Grade V',
};

/**
 * @param {Object} formState - { selectedFindings: Set<string>, multipleInjuries: bool }
 * @param {Object} definition - aastLiverDefinition or aastSpleenDefinition
 * @returns {Object} template variables
 */
export function calculateAast(formState, definition) {
  const { selectedFindings, multipleInjuries } = formState;
  const selected = selectedFindings || new Set();

  let maxGrade = 0;
  const findingsByCategory = {};
  const allSelected = [];
  let lowGradeCount = 0;

  for (const cat of definition.categories) {
    const catFindings = [];
    for (const f of cat.findings) {
      if (selected.has(f.id)) {
        catFindings.push(f);
        allSelected.push({ ...f, category: cat.label });
        if (f.grade > maxGrade) maxGrade = f.grade;
        if (f.grade <= 2) lowGradeCount++;
      }
    }
    if (catFindings.length > 0) {
      findingsByCategory[cat.id] = catFindings;
    }
  }

  // Multiple Grade I/II injuries → advance to III
  if (multipleInjuries && maxGrade <= 2 && maxGrade > 0) {
    maxGrade = 3;
  }

  const grade = maxGrade > 0 ? maxGrade : null;
  const gradeLabel = grade ? GRADE_LABELS[grade] : '--';

  // Build findings text for report
  const findingsLines = [];
  for (const cat of definition.categories) {
    const catFindings = findingsByCategory[cat.id];
    if (catFindings) {
      findingsLines.push(`${cat.label}: ${catFindings.map((f) => f.label).join('; ')}`);
    }
  }
  if (multipleInjuries) {
    findingsLines.push('Multiple low-grade injuries present');
  }

  const findingsText = findingsLines.length > 0 ? findingsLines.join('\n') : 'No injuries identified.';
  const hasFindings = allSelected.length > 0;

  return {
    organ: definition.organ,
    grade,
    gradeLabel,
    gradeLevel: grade || 0,
    findingsText,
    hasFindings,
    findingsProvided: hasFindings,
    multipleInjuries,
    selectedCount: allSelected.length,
  };
}
