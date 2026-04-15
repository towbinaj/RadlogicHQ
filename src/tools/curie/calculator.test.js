import { describe, it, expect } from 'vitest';
import { calculateMibg } from './calculator.js';
import { curieDefinition } from './definition.js';

// Retroactive coverage for the oncologic-response tool backlog.
// See docs/test.md section 9.

// Helper: build a segmentScores object assigning `value` to every segment.
function fillAll(mode, value) {
  const segments = mode === 'siopen'
    ? curieDefinition.siopenSegments
    : curieDefinition.curieSegments;
  const out = {};
  for (const s of segments) out[s.id] = String(value);
  return out;
}

describe('calculateMibg — Curie mode', () => {
  it('10 segments × 3 = 30 max', () => {
    const r = calculateMibg(fillAll('curie', 3), 'curie');
    expect(r.segmentCount).toBe(10);
    expect(r.maxTotal).toBe(30);
    expect(r.total).toBe(30);
    expect(r.totalLabel).toBe('30 / 30');
    expect(r.allAssessed).toBe(true);
    expect(r.unfavorable).toBe(true);
    expect(r.interpretation).toMatch(/Unfavorable/);
    expect(r.level).toBe(4);
    expect(r.threshold).toBe(2);
  });

  it('all zeros → favorable', () => {
    const r = calculateMibg(fillAll('curie', 0), 'curie');
    expect(r.total).toBe(0);
    expect(r.favorable).toBe(true);
    expect(r.level).toBe(1);
    expect(r.interpretation).toMatch(/Favorable/);
  });

  it('total exactly 2 → favorable (boundary)', () => {
    const scores = fillAll('curie', 0);
    scores.craniofacial = '2';
    const r = calculateMibg(scores, 'curie');
    expect(r.total).toBe(2);
    expect(r.favorable).toBe(true);
    expect(r.unfavorable).toBe(false);
    expect(r.level).toBe(1);
  });

  it('total exactly 3 → unfavorable (just above threshold)', () => {
    const scores = fillAll('curie', 0);
    scores.craniofacial = '2';
    scores.chest = '1';
    const r = calculateMibg(scores, 'curie');
    expect(r.total).toBe(3);
    expect(r.unfavorable).toBe(true);
    expect(r.level).toBe(4);
  });

  it('partial scoring → allAssessed false, no interpretation', () => {
    const r = calculateMibg({ craniofacial: '2', chest: '1' }, 'curie');
    expect(r.assessed).toBe(2);
    expect(r.allAssessed).toBe(false);
    expect(r.favorable).toBe(false);
    expect(r.unfavorable).toBe(false);
    expect(r.interpretation).toBe('');
    expect(r.level).toBe(0);
    // Partial total still surfaces for the UI.
    expect(r.total).toBe(3);
  });

  it('empty scores → null total', () => {
    const r = calculateMibg({}, 'curie');
    expect(r.assessed).toBe(0);
    expect(r.total).toBeNull();
    expect(r.totalLabel).toBe('--');
    expect(r.level).toBe(0);
  });
});

describe('calculateMibg — SIOPEN mode', () => {
  it('12 segments × 6 = 72 max', () => {
    const r = calculateMibg(fillAll('siopen', 6), 'siopen');
    expect(r.segmentCount).toBe(12);
    expect(r.maxTotal).toBe(72);
    expect(r.total).toBe(72);
    expect(r.threshold).toBe(3);
    expect(r.unfavorable).toBe(true);
    expect(r.level).toBe(4);
    expect(r.modeLabel).toBe('SIOPEN');
  });

  it('total 3 → favorable (SIOPEN boundary)', () => {
    const scores = fillAll('siopen', 0);
    scores.skull = '3';
    const r = calculateMibg(scores, 'siopen');
    expect(r.total).toBe(3);
    expect(r.favorable).toBe(true);
    expect(r.level).toBe(1);
  });

  it('total 4 → unfavorable (SIOPEN just above threshold)', () => {
    const scores = fillAll('siopen', 0);
    scores.skull = '4';
    const r = calculateMibg(scores, 'siopen');
    expect(r.total).toBe(4);
    expect(r.unfavorable).toBe(true);
    expect(r.level).toBe(4);
  });

  it('mode defaults to curie if siopen not passed', () => {
    const r = calculateMibg({}, undefined);
    expect(r.modeLabel).toBe('Curie');
    expect(r.segmentCount).toBe(10);
    expect(r.threshold).toBe(2);
  });
});

describe('calculateMibg — segment details', () => {
  it('each segment gets an entry in segmentDetails', () => {
    const r = calculateMibg({ craniofacial: '2' }, 'curie');
    expect(r.segmentDetails).toHaveLength(10);
    const cranio = r.segmentDetails.find((s) => s.id === 'craniofacial');
    expect(cranio.score).toBe(2);
    const chest = r.segmentDetails.find((s) => s.id === 'chest');
    expect(chest.score).toBeNull();
  });
});
