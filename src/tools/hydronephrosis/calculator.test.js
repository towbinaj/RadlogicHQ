import { describe, it, expect } from 'vitest';
import { calculateHydronephrosis } from './calculator.js';

// Retroactive coverage for commit 06c811b (Phase 2 bilateral refactor).
// See docs/test.md section 9.

describe('calculateHydronephrosis — single-side UTD postnatal', () => {
  it('P1 returns mild label + follow-up management', () => {
    const r = calculateHydronephrosis(
      { side: 'right', grade: 'P1', aprpd: 12 },
      'utd-postnatal',
    );
    expect(r.bilateral).toBe(false);
    expect(r.sideLabel).toBe('Right');
    expect(r.gradeLabel).toBe('UTD P1 (Mild)');
    expect(r.management).toMatch(/Follow-up/i);
    expect(r.aprpdLabel).toBe('12 mm');
    expect(r.level).toBe(2);
  });

  it('P2 returns moderate label and level 4', () => {
    const r = calculateHydronephrosis(
      { side: 'left', grade: 'P2', aprpd: 18 },
      'utd-postnatal',
    );
    expect(r.sideLabel).toBe('Left');
    expect(r.gradeLabel).toBe('UTD P2 (Moderate)');
    expect(r.level).toBe(4);
  });

  it('P3 returns severe label and level 4', () => {
    const r = calculateHydronephrosis(
      { side: 'right', grade: 'P3' },
      'utd-postnatal',
    );
    expect(r.gradeLabel).toBe('UTD P3 (Severe)');
    expect(r.management).toMatch(/Further evaluation/i);
    expect(r.level).toBe(4);
  });

  it('normal returns level 1 and no follow-up', () => {
    const r = calculateHydronephrosis(
      { side: 'right', grade: 'normal' },
      'utd-postnatal',
    );
    expect(r.gradeLabel).toBe('Normal');
    expect(r.level).toBe(1);
    expect(r.management).toMatch(/No follow-up/i);
  });
});

describe('calculateHydronephrosis — SFU grades', () => {
  it('SFU grade 4 returns correct label', () => {
    const r = calculateHydronephrosis(
      { side: 'right', grade: '4' },
      'sfu',
    );
    expect(r.gradeLabel).toBe('SFU Grade 4');
    expect(r.modeLabel).toBe('SFU');
    expect(r.level).toBe(4);
  });

  it('SFU grade 0 returns normal level', () => {
    const r = calculateHydronephrosis(
      { side: 'left', grade: '0' },
      'sfu',
    );
    expect(r.gradeLabel).toBe('SFU Grade 0');
    expect(r.level).toBe(1);
  });
});

describe('calculateHydronephrosis — UTD antenatal', () => {
  it('A1 returns mild antenatal label', () => {
    const r = calculateHydronephrosis(
      { side: 'right', grade: 'A1', aprpd: 8 },
      'utd-antenatal',
    );
    expect(r.gradeLabel).toBe('UTD A1 (Mild)');
    expect(r.modeLabel).toBe('UTD (Antenatal)');
    expect(r.level).toBe(2);
  });

  it('A2-3 returns moderate-severe label with level 4', () => {
    const r = calculateHydronephrosis(
      { side: 'right', grade: 'A2-3' },
      'utd-antenatal',
    );
    expect(r.gradeLabel).toBe('UTD A2-3 (Moderate-Severe)');
    expect(r.level).toBe(4);
  });
});

describe('calculateHydronephrosis — bilateral', () => {
  it('combines both sides into gradeLabel and aprpdLabel', () => {
    const r = calculateHydronephrosis(
      {
        side: 'bilateral',
        rightGrade: 'P2', leftGrade: 'P1',
        rightAprpd: 18, leftAprpd: 11,
      },
      'utd-postnatal',
    );
    expect(r.bilateral).toBe(true);
    expect(r.sideLabel).toBe('Bilateral');
    expect(r.gradeLabel).toContain('Right: UTD P2 (Moderate)');
    expect(r.gradeLabel).toContain('Left: UTD P1 (Mild)');
    expect(r.aprpdLabel).toBe('Right 18 mm, Left 11 mm');
    // Description suppressed in bilateral mode.
    expect(r.gradeDescription).toBe('');
    // Management from the more severe side (P2 > P1).
    expect(r.management).toMatch(/further evaluation/i);
    expect(r.level).toBe(4);
  });

  it('more severe side drives management when left dominant', () => {
    const r = calculateHydronephrosis(
      {
        side: 'bilateral',
        rightGrade: 'P1', leftGrade: 'P3',
      },
      'utd-postnatal',
    );
    // Left P3 is the dominant concern → management from P3.
    expect(r.management).toMatch(/Further evaluation recommended/i);
    expect(r.level).toBe(4);
  });

  it('bilateral with only one side filled still categorizes', () => {
    const r = calculateHydronephrosis(
      {
        side: 'bilateral',
        rightGrade: 'P3', rightAprpd: 20,
      },
      'utd-postnatal',
    );
    expect(r.bilateral).toBe(true);
    expect(r.rightGradeProvided).toBe(true);
    expect(r.leftGradeProvided).toBe(false);
    expect(r.gradeLabel).toBe('Right: UTD P3 (Severe)');
    expect(r.aprpdLabel).toBe('Right 20 mm');
    expect(r.level).toBe(4);
  });

  it('bilateral with no grades returns placeholder labels', () => {
    const r = calculateHydronephrosis(
      { side: 'bilateral' },
      'utd-postnatal',
    );
    expect(r.bilateral).toBe(true);
    expect(r.gradeLabel).toBe('--');
    expect(r.aprpdLabel).toBe('');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });
});

describe('calculateHydronephrosis — edge cases', () => {
  it('unset grade returns placeholder without crashing', () => {
    const r = calculateHydronephrosis(
      { side: 'right' },
      'utd-postnatal',
    );
    expect(r.gradeLabel).toBe('--');
    expect(r.gradeProvided).toBe(false);
    expect(r.level).toBe(0);
  });

  it('null aprpd omits aprpdLabel in single-side mode', () => {
    const r = calculateHydronephrosis(
      { side: 'right', grade: 'P2' },
      'utd-postnatal',
    );
    expect(r.aprpdProvided).toBe(false);
    expect(r.aprpdLabel).toBe('');
  });
});
