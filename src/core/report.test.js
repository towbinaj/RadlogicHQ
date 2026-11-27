import { describe, it, expect } from 'vitest';
import { renderBlocks } from './report.js';

describe('renderBlocks pointsTemplate spacing', () => {
  const blocks = [
    { id: 'shape', template: 'Shape: {{shape}}', pointsTemplate: ' ({{shapePoints}} pts)', enabled: true, showPoints: true },
  ];

  it('keeps the leading space of pointsTemplate', () => {
    expect(renderBlocks(blocks, { shape: 'Not selected', shapePoints: 0 })).toBe('Shape: Not selected (0 pts)');
  });

  it('omits points when globalShowPoints is false', () => {
    expect(renderBlocks(blocks, { shape: 'Taller-than-wide', shapePoints: 3 }, false)).toBe('Shape: Taller-than-wide');
  });
});
