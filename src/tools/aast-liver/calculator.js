/**
 * AAST organ injury grade calculator.
 * Shared logic for both liver and spleen — pass in the definition.
 *
 * Rules:
 *   1. Grade = highest grade among all selected findings.
 *   2. Multiple Grade I/II injuries → advance to Grade III, unless the
 *      definition sets advanceMultipleInjuries: false (2024 pancreas and
 *      2025 kidney scales do not advance).
 *   3. definition.escalations: [{ allOf, anyOf, grade }] raise the grade when
 *      all allOf ids and at least one anyOf id are selected (e.g. 2025 kidney:
 *      active bleeding + multifragmented kidney -> Grade V). Never lowers.
 *   4. Findings may carry a subgrade letter (2024 pancreas: III-N, III-A...).
 *      The label uses the subgrade of the top-grade findings; if several,
 *      the one latest in definition.subgradeOrder wins.
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
  const { selectedFindings } = formState;
  const advance = definition.advanceMultipleInjuries !== false;
  const multipleInjuries = advance ? !!formState.multipleInjuries : false;
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

  // Combination rules (never lower the grade)
  for (const esc of definition.escalations || []) {
    const allOk = (esc.allOf || []).every((id) => selected.has(id));
    const anyOk = !esc.anyOf || esc.anyOf.some((id) => selected.has(id));
    if (allOk && anyOk && esc.grade > maxGrade) maxGrade = esc.grade;
  }

  const grade = maxGrade > 0 ? maxGrade : null;

  // Subgrade from the findings at the final grade
  let subgrade = null;
  if (grade) {
    const order = definition.subgradeOrder || [];
    for (const f of allSelected) {
      if (f.grade !== grade || !f.subgrade) continue;
      if (subgrade === null || order.indexOf(f.subgrade) > order.indexOf(subgrade)) {
        subgrade = f.subgrade;
      }
    }
  }

  const gradeLabel = grade
    ? GRADE_LABELS[grade] + (subgrade ? `-${subgrade}` : '')
    : '--';

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
    subgrade,
    gradeLabel,
    scaleVersion: definition.scaleVersion || '',
    gradeLevel: grade || 0,
    findingsText,
    hasFindings,
    findingsProvided: hasFindings,
    multipleInjuries,
    selectedCount: allSelected.length,
  };
}
