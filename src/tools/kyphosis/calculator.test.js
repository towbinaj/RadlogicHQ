import { describe, it, expect } from 'vitest';
import { calculateKyphosis } from './calculator.js';

// Retroactive coverage for the measurement tool backlog.
// See docs/test.md section 9.

describe('calculateKyphosis — thoracic angle interpretation', () => {
  it.each([
    [0,  'Normal',                     1],
    [20, 'Normal',                     1],
    [40, 'Normal',                     1],
    [41, 'Borderline increased',       2],
    [45, 'Borderline increased',       2],
    [46, 'Increased (hyperkyphosis)',  3],
    [70, 'Increased (hyperkyphosis)',  3],
  ])('thoracic %d° → %s (level %d)', (thoracicAngle, interpretation, level) => {
    const r = calculateKyphosis({ thoracicAngle });
    expect(r.thoracicInterpretation).toBe(interpretation);
    expect(r.thoracicLevel).toBe(level);
    expect(r.level).toBe(level);
    expect(r.thoracicLabel).toBe(`${thoracicAngle}\u00b0`);
  });

  it('thoracic unset → empty interpretation, level 0', () => {
    const r = calculateKyphosis({});
    expect(r.thoracicProvided).toBe(false);
    expect(r.thoracicLabel).toBe('--');
    expect(r.thoracicInterpretation).toBe('');
    expect(r.level).toBe(0);
  });
});

describe('calculateKyphosis — lumbar lordosis interpretation', () => {
  it.each([
    [30, 'Decreased (hypolordosis)'],
    [39, 'Decreased (hypolordosis)'],
    [40, 'Normal'],
    [50, 'Normal'],
    [60, 'Normal'],
    [61, 'Increased (hyperlordosis)'],
    [75, 'Increased (hyperlordosis)'],
  ])('lumbar %d° → %s', (lumbarAngle, interpretation) => {
    const r = calculateKyphosis({ lumbarAngle });
    expect(r.lumbarInterpretation).toBe(interpretation);
    expect(r.lumbarLabel).toBe(`${lumbarAngle}\u00b0`);
  });

  it('lumbar unset → empty interpretation', () => {
    const r = calculateKyphosis({});
    expect(r.lumbarProvided).toBe(false);
    expect(r.lumbarLabel).toBe('--');
    expect(r.lumbarInterpretation).toBe('');
  });
});

describe('calculateKyphosis — wedging and Scheuermann', () => {
  it('wedging present → full Scheuermann criterion', () => {
    const r = calculateKyphosis({ wedging: 'present' });
    expect(r.wedgingLabel).toMatch(/Anterior vertebral body wedging/i);
    expect(r.wedgingLabel).toContain('\u22655\u00b0');      // ≥5° wedging
    expect(r.wedgingLabel).toContain('\u22653 adjacent');   // ≥3 adjacent
  });

  it('wedging none → "No anterior wedging"', () => {
    const r = calculateKyphosis({ wedging: 'none' });
    expect(r.wedgingLabel).toBe('No anterior wedging');
  });

  it('wedging unset → empty label', () => {
    const r = calculateKyphosis({});
    expect(r.wedgingLabel).toBe('');
    expect(r.wedgingProvided).toBe(false);
  });

  it('scheuermann true → Scheuermann disease label', () => {
    const r = calculateKyphosis({ scheuermann: true });
    expect(r.scheuermannsLabel).toMatch(/Scheuermann disease/i);
    expect(r.scheuermannsProvided).toBe(true);
  });

  it('scheuermann false → empty label', () => {
    const r = calculateKyphosis({ scheuermann: false });
    expect(r.scheuermannsLabel).toBe('');
    expect(r.scheuermannsProvided).toBe(false);
  });
});

describe('calculateKyphosis — prior measurements passthrough', () => {
  it('priorThoracic/lumbar populated when provided', () => {
    const r = calculateKyphosis({
      priorThoracic: '42° last year',
      priorLumbar: '50° last year',
    });
    expect(r.priorThoracicText).toBe('42° last year');
    expect(r.priorThoracicProvided).toBe(true);
    expect(r.priorLumbarText).toBe('50° last year');
  });
});
