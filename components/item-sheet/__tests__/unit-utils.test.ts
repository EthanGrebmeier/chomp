import { describe, expect, it } from 'vitest';

import { formatQuantityUnit, normalizeUnit } from '../unit-utils';

describe('normalizeUnit', () => {
  it('defaults empty or missing values to each', () => {
    expect(normalizeUnit()).toBe('each');
    expect(normalizeUnit(null)).toBe('each');
    expect(normalizeUnit('')).toBe('each');
    expect(normalizeUnit('   ')).toBe('each');
  });

  it('trims and limits unit length', () => {
    expect(normalizeUnit('  extraorDINARYlength  ')).toBe('extraorDINARYlen');
  });

  it('maps catalog labels and values to canonical values', () => {
    expect(normalizeUnit('Cup')).toBe('cup');
    expect(normalizeUnit('tablespoon')).toBe('tbsp');
    expect(normalizeUnit('tsp')).toBe('tsp');
  });

  it('keeps custom units untouched after trimming', () => {
    expect(normalizeUnit('My Special')).toBe('My Special');
  });
});

describe('formatQuantityUnit', () => {
  it('formats each units as a multiplier', () => {
    expect(formatQuantityUnit(2, 'each')).toBe('x2');
    expect(formatQuantityUnit(3, '  ')).toBe('x3');
  });

  it('formats non-each units with quantity and unit', () => {
    expect(formatQuantityUnit(1, 'cup')).toBe('1 cup');
    expect(formatQuantityUnit(4, 'MyUnit')).toBe('4 MyUnit');
  });
});
