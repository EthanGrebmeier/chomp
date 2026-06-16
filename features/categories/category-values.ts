import {
  createCategoryValueFromName,
  getCategoryNameKey,
  isBuiltInCategoryName,
  isBuiltInCategoryValue,
  normalizeCategoryName,
} from '../shared/category/categories';

import { CustomCategory } from './types';

type ExistingCategory = Pick<CustomCategory, 'id' | 'name' | 'value'>;

export const getUniqueCategoryValue = (
  name: string,
  existingCategories: ExistingCategory[]
) => {
  const baseValue = createCategoryValueFromName(name);
  const existingValues = new Set(existingCategories.map(category => category.value));
  let value = baseValue;
  let suffix = 2;

  while (existingValues.has(value) || isBuiltInCategoryValue(value)) {
    value = `${baseValue}-${suffix}`;
    suffix += 1;
  }

  return value;
};

export const findDuplicateCategoryName = ({
  name,
  existingCategories,
  excludingCategoryId,
}: {
  name: string;
  existingCategories: ExistingCategory[];
  excludingCategoryId?: string;
}) => {
  const normalizedName = normalizeCategoryName(name);
  const nameKey = getCategoryNameKey(normalizedName);

  if (!normalizedName) {
    return 'Category name cannot be empty';
  }

  const matchesBuiltInCategory =
    isBuiltInCategoryName(normalizedName) ||
    isBuiltInCategoryValue(createCategoryValueFromName(normalizedName));
  const matchesCustomCategory = existingCategories.some(
    category =>
      category.id !== excludingCategoryId &&
      getCategoryNameKey(category.name) === nameKey
  );

  if (matchesBuiltInCategory || matchesCustomCategory) {
    return 'A category with this name already exists';
  }

  return null;
};
