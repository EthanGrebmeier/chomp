import {
  builtInCategoryOptions,
  CategoryOption,
  createCategoryValueFromName,
  getCategoryNameKey,
  isBuiltInCategoryValue,
  normalizeCategoryName,
} from '../shared/category/categories';

import { CategoryRecord } from './types';

type ExistingRecord = Pick<CategoryRecord, 'value'>;
type HiddenCandidateRecord = Pick<
  CategoryRecord,
  'name' | 'value' | 'isHidden'
>;

export const getUniqueCategoryValue = (
  name: string,
  existingRecords: ExistingRecord[]
) => {
  const baseValue = createCategoryValueFromName(name);
  const existingValues = new Set(existingRecords.map(record => record.value));
  let value = baseValue;
  let suffix = 2;

  while (existingValues.has(value) || isBuiltInCategoryValue(value)) {
    value = `${baseValue}-${suffix}`;
    suffix += 1;
  }

  return value;
};

/**
 * Validates a category name against the categories the user currently sees
 * (built-in and custom alike). Returns an error message or null.
 */
export const findDuplicateCategoryName = ({
  name,
  options,
  excludingValue,
}: {
  name: string;
  options: Pick<CategoryOption, 'label' | 'value'>[];
  excludingValue?: string;
}) => {
  const normalizedName = normalizeCategoryName(name);

  if (!normalizedName) {
    return 'Category name cannot be empty';
  }

  const nameKey = getCategoryNameKey(normalizedName);
  const isDuplicate = options.some(
    option =>
      option.value !== excludingValue &&
      getCategoryNameKey(option.label) === nameKey
  );

  return isDuplicate ? 'A category with this name already exists' : null;
};

/**
 * Finds a hidden built-in category matching `name` (by its default label or
 * its customized name) so re-creating it restores the built-in instead of
 * creating a look-alike custom category.
 */
export const findHiddenBuiltInCategoryByName = <
  T extends HiddenCandidateRecord,
>(
  name: string,
  records: T[]
) => {
  const nameKey = getCategoryNameKey(name);

  return records.find(record => {
    if (!record.isHidden || !isBuiltInCategoryValue(record.value)) {
      return false;
    }
    const builtIn = builtInCategoryOptions.find(
      option => option.value === record.value
    );
    return (
      getCategoryNameKey(record.name) === nameKey ||
      (builtIn !== undefined && getCategoryNameKey(builtIn.label) === nameKey)
    );
  });
};
