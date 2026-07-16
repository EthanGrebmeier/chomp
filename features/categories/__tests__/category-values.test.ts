import { describe, expect, it } from 'vitest';

import {
  getCategoryColor,
  getCategoryLabel,
  mergeCategoryOptions,
} from '../../shared/category/categories';
import {
  getFallbackCategoryColor,
  isCategoryColor,
  resolveCategoryColor,
} from '../../shared/category/category-colors';
import {
  findDuplicateCategoryName,
  getUniqueCategoryValue,
} from '../category-values';

const existingCategories = [
  {
    id: 'category-1',
    name: 'Bulk Foods',
    value: 'bulk-foods',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('category value helpers', () => {
  it('creates unique values without colliding with existing categories', () => {
    expect(getUniqueCategoryValue('Bulk Foods', existingCategories)).toBe(
      'bulk-foods-2'
    );
  });

  it('prevents duplicate built-in and custom category names', () => {
    expect(
      findDuplicateCategoryName({
        name: 'Produce',
        existingCategories,
      })
    ).toBe('A category with this name already exists');

    expect(
      findDuplicateCategoryName({
        name: ' bulk   foods ',
        existingCategories,
      })
    ).toBe('A category with this name already exists');
  });

  it('allows editing a category without matching itself', () => {
    expect(
      findDuplicateCategoryName({
        name: 'Bulk Foods',
        existingCategories,
        excludingCategoryId: 'category-1',
      })
    ).toBeNull();
  });
});

describe('category option helpers', () => {
  it('merges built-in categories before sorted custom categories', () => {
    const options = mergeCategoryOptions([
      {
        id: 'category-2',
        name: 'Tea',
        value: 'tea',
        color: 'purple',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      ...existingCategories,
    ]);

    expect(options[0]).toMatchObject({
      label: 'Produce',
      value: 'produce',
      color: 'green',
      isBuiltIn: true,
    });
    expect(options.at(-2)).toMatchObject({
      label: 'Bulk Foods',
      value: 'bulk-foods',
      isBuiltIn: false,
    });
    expect(options.at(-1)).toMatchObject({
      label: 'Tea',
      value: 'tea',
      color: 'purple',
      isBuiltIn: false,
    });
  });

  it('falls back to a readable label for unknown category values', () => {
    expect(getCategoryLabel([], 'bulk-foods')).toBe('Bulk Foods');
  });

  it('uses persisted custom colors and stable fallbacks for legacy categories', () => {
    const options = mergeCategoryOptions(existingCategories);
    const fallbackColor = getFallbackCategoryColor('bulk-foods');

    expect(getCategoryColor(options, 'bulk-foods')).toBe(fallbackColor);
    expect(resolveCategoryColor('bulk-foods', 'not-a-color')).toBe(
      fallbackColor
    );
    expect(isCategoryColor(fallbackColor)).toBe(true);
  });
});
