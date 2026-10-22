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
  findHiddenBuiltInCategoryByName,
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

const produceOverride = {
  id: 'override-1',
  name: 'Veggies',
  value: 'produce',
  color: 'teal',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('category value helpers', () => {
  it('creates unique values without colliding with existing categories', () => {
    expect(getUniqueCategoryValue('Bulk Foods', existingCategories)).toBe(
      'bulk-foods-2'
    );
    expect(getUniqueCategoryValue('Produce', [])).toBe('produce-2');
  });

  it('prevents duplicate built-in and custom category names', () => {
    const options = mergeCategoryOptions(existingCategories);

    expect(findDuplicateCategoryName({ name: 'Produce', options })).toBe(
      'A category with this name already exists'
    );
    expect(findDuplicateCategoryName({ name: ' bulk   foods ', options })).toBe(
      'A category with this name already exists'
    );
  });

  it('allows editing a category without matching itself', () => {
    const options = mergeCategoryOptions(existingCategories);

    expect(
      findDuplicateCategoryName({
        name: 'Bulk Foods',
        options,
        excludingValue: 'bulk-foods',
      })
    ).toBeNull();
    expect(
      findDuplicateCategoryName({
        name: 'produce',
        options,
        excludingValue: 'produce',
      })
    ).toBeNull();
  });

  it('frees up the name of a hidden built-in category', () => {
    const records = [{ ...produceOverride, isHidden: true }];

    expect(
      findDuplicateCategoryName({
        name: 'Produce',
        options: mergeCategoryOptions(records),
      })
    ).toBeNull();
    expect(findHiddenBuiltInCategoryByName('produce', records)?.id).toBe(
      'override-1'
    );
    expect(findHiddenBuiltInCategoryByName('Veggies', records)?.id).toBe(
      'override-1'
    );
    expect(
      findHiddenBuiltInCategoryByName('Produce', [produceOverride])
    ).toBeUndefined();
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

  it('applies built-in overrides in place and drops hidden built-ins', () => {
    const options = mergeCategoryOptions([
      produceOverride,
      {
        ...produceOverride,
        id: 'override-2',
        name: 'Deli',
        value: 'deli',
        isHidden: true,
      },
    ]);

    expect(options[0]).toMatchObject({
      id: 'override-1',
      label: 'Veggies',
      value: 'produce',
      color: 'teal',
      isBuiltIn: true,
    });
    expect(options.some(option => option.value === 'deli')).toBe(false);
    expect(getCategoryLabel(options, 'deli')).toBe('Deli');
    expect(getCategoryLabel(options, 'health-beauty')).toBe('Health & Beauty');
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
