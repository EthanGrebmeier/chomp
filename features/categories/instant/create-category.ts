import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { normalizeCategoryName } from '../../shared/category/categories';
import {
  findDuplicateCategoryName,
  getUniqueCategoryValue,
} from '../category-values';

import { queryMyCategories } from './category-query';

export type CreateCategoryArgs = {
  name: string;
};

export const createCategory = async ({ name }: CreateCategoryArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const existingCategories = await queryMyCategories(user.id);
  const duplicateError = findDuplicateCategoryName({
    name,
    existingCategories,
  });

  if (duplicateError) {
    throw new Error(duplicateError);
  }

  const normalizedName = normalizeCategoryName(name);
  const categoryId = id();
  const now = new Date().toISOString();
  const categoryValue = getUniqueCategoryValue(normalizedName, existingCategories);

  await db.transact([
    tx.categories[categoryId].update(
      trimStringFields({
        name: normalizedName,
        value: categoryValue,
        createdAt: now,
        updatedAt: now,
      })
    ),
    tx.categories[categoryId].link({
      user: user.id,
    }),
  ]);

  return { id: categoryId, value: categoryValue };
};
