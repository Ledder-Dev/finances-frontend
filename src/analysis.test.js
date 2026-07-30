import { describe, it, expect } from 'vitest';
import { trimmedMean } from './analysis.js';

describe('trimmedMean', () => {
  it('returns 0 for empty array', () => {
    expect(trimmedMean([])).toBe(0);
  });

  it('averages plain when fewer than 3 values', () => {
    expect(trimmedMean([10])).toBe(10);
    expect(trimmedMean([10, 20])).toBe(15);
  });

  it('trims one lowest and one highest before averaging', () => {
    expect(trimmedMean([1, 100, 200, 300, 1000])).toBe((100 + 200 + 300) / 3);
  });

  it('ignores input order (sorts before trimming)', () => {
    expect(trimmedMean([300, 1, 1000, 100, 200])).toBe((100 + 200 + 300) / 3);
  });
});
