import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { normalizeCategoryName } from '../../shared/category/categories';
import {
  CategoryColor,
  isCategoryColor,
} from '../../shared/category/category-colors';
import { findDuplicateCategoryName } from '../category-values';

import { queryMyCategories } from './category-query';

export type UpdateCategoryArgs = {
  categoryId: string;
  updates: {
    name?: string;
    color?: CategoryColor;
  };
};

export const updateCategory = async ({
  categoryId,
  updates,
}: UpdateCategoryArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }
  if (updates.color !== undefined && !isCategoryColor(updates.color)) {
    throw new Error('Invalid category color');
  }

  const normalizedUpdates = {
    ...updates,
    name:
      updates.name === undefined
        ? undefined
        : normalizeCategoryName(updates.name),
  };

  if (normalizedUpdates.name !== undefined) {
    const existingCategories = await queryMyCategories(user.id);
    const duplicateError = findDuplicateCategoryName({
      name: normalizedUpdates.name,
      existingCategories,
      excludingCategoryId: categoryId,
    });

    if (duplicateError) {
      throw new Error(duplicateError);
    }
  }

  await db.transact([
    db.tx.categories[categoryId].update(
      trimStringFields({
        ...normalizedUpdates,
        updatedAt: new Date().toISOString(),
      })
    ),
  ]);
};
