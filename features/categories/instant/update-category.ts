import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import {
  CategoryOption,
  isBuiltInCategoryValue,
  mergeCategoryOptions,
  normalizeCategoryName,
} from '../../shared/category/categories';
import {
  CategoryColor,
  isCategoryColor,
} from '../../shared/category/category-colors';
import { findDuplicateCategoryName } from '../category-values';

import { queryMyCategories } from './category-query';

export type CategoryUpdates = {
  name?: string;
  color?: CategoryColor;
  isHidden?: boolean;
};

type UpdateCategoryArgs = {
  category: Pick<CategoryOption, 'value' | 'label' | 'color'>;
  updates: CategoryUpdates;
};

/**
 * Updates a category. Custom categories are updated in place; built-in
 * categories are customized through an override record keyed by their value,
 * which is created on first edit.
 */
export const updateCategory = async ({
  category,
  updates,
}: UpdateCategoryArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }
  if (updates.color !== undefined && !isCategoryColor(updates.color)) {
    throw new Error('Invalid category color');
  }

  const records = await queryMyCategories(user.id);
  const name =
    updates.name === undefined
      ? undefined
      : normalizeCategoryName(updates.name);

  if (name !== undefined) {
    const duplicateError = findDuplicateCategoryName({
      name,
      options: mergeCategoryOptions(records),
      excludingValue: category.value,
    });

    if (duplicateError) {
      throw new Error(duplicateError);
    }
  }

  const now = new Date().toISOString();
  const existingRecord = records.find(
    record => record.value === category.value
  );

  if (existingRecord) {
    await db.transact([
      tx.categories[existingRecord.id].update(
        trimStringFields({ ...updates, name, updatedAt: now })
      ),
    ]);
    return;
  }

  if (!isBuiltInCategoryValue(category.value)) {
    throw new Error('Category not found');
  }

  const overrideId = id();
  await db.transact([
    tx.categories[overrideId].update(
      trimStringFields({
        name: name ?? category.label,
        value: category.value,
        color: updates.color ?? category.color,
        isHidden: updates.isHidden ?? false,
        createdAt: now,
        updatedAt: now,
      })
    ),
    tx.categories[overrideId].link({ user: user.id }),
  ]);
};
