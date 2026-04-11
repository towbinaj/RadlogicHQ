import { describe, it, expect } from 'vitest';
import { calculateAast } from './calculator.js';

// Mock definition matching the shape expected by calculateAast
const mockDefinition = {
  organ: 'Liver',
  categories: [
    {
      id: 'parenchymal',
      label: 'Parenchymal',
      findings: [
        { id: 'subCapsularLt10', label: 'Subcapsular hematoma <10%', grade: 1 },
        { id: 'laceration1cm', label: 'Laceration <1 cm depth', grade: 1 },
        { id: 'subCapsular10to50', label: 'Subcapsular hematoma 10-50%', grade: 2 },
        { id: 'laceration1to3cm', label: 'Laceration 1-3 cm depth', grade: 2 },
        { id: 'laceration3cm', label: 'Laceration >3 cm depth', grade: 3 },
      ],
    },
    {
      id: 'vascular',
      label: 'Vascular',
      findings: [
        { id: 'activeBleed', label: 'Active bleeding extending beyond parenchyma', grade: 4 },
        { id: 'hepaticAvulsion', label: 'Hepatic venous avulsion', grade: 5 },
      ],
    },
  ],
};

describe('calculateAast', () => {
  it('no findings → null grade', () => {
    const result = calculateAast({ selectedFindings: new Set() }, mockDefinition);
    expect(result.grade).toBeNull();
    expect(result.gradeLabel).toBe('--');
    expect(result.hasFindings).toBe(false);
  });

  it('single Grade II finding → Grade II', () => {
    const result = calculateAast(
      { selectedFindings: new Set(['subCapsular10to50']) },
      mockDefinition,
    );
    expect(result.grade).toBe(2);
    expect(result.gradeLabel).toBe('Grade II');
  });

  it('single Grade V finding → Grade V', () => {
    const result = calculateAast(
      { selectedFindings: new Set(['hepaticAvulsion']) },
      mockDefinition,
    );
    expect(result.grade).toBe(5);
    expect(result.gradeLabel).toBe('Grade V');
  });

  it('max grade wins among multiple findings', () => {
    const result = calculateAast(
      { selectedFindings: new Set(['subCapsularLt10', 'activeBleed']) },
      mockDefinition,
    );
    expect(result.grade).toBe(4);
    expect(result.gradeLabel).toBe('Grade IV');
  });

  it('multiple Grade I/II + multipleInjuries → Grade III advancement', () => {
    const result = calculateAast(
      {
        selectedFindings: new Set(['subCapsularLt10', 'laceration1to3cm']),
        multipleInjuries: true,
      },
      mockDefinition,
    );
    expect(result.grade).toBe(3);
    expect(result.gradeLabel).toBe('Grade III');
    expect(result.multipleInjuries).toBe(true);
  });

  it('multipleInjuries does not advance grade above II if already higher', () => {
    const result = calculateAast(
      {
        selectedFindings: new Set(['laceration3cm']),
        multipleInjuries: true,
      },
      mockDefinition,
    );
    // laceration3cm is Grade III, multipleInjuries should not change it
    expect(result.grade).toBe(3);
  });

  it('handles missing selectedFindings gracefully', () => {
    const result = calculateAast({}, mockDefinition);
    expect(result.grade).toBeNull();
    expect(result.selectedCount).toBe(0);
  });

  it('reports correct organ name', () => {
    const result = calculateAast({ selectedFindings: new Set() }, mockDefinition);
    expect(result.organ).toBe('Liver');
  });

  it('findingsText lists selected findings by category', () => {
    const result = calculateAast(
      { selectedFindings: new Set(['subCapsularLt10', 'activeBleed']) },
      mockDefinition,
    );
    expect(result.findingsText).toContain('Parenchymal');
    expect(result.findingsText).toContain('Vascular');
  });
});
