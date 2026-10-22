import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import {
  mergeCategoryOptions,
  normalizeCategoryName,
} from '../../shared/category/categories';
import {
  CategoryColor,
  isCategoryColor,
} from '../../shared/category/category-colors';
import {
  findDuplicateCategoryName,
  findHiddenBuiltInCategoryByName,
  getUniqueCategoryValue,
} from '../category-values';

import { queryMyCategories } from './category-query';

export type CreateCategoryArgs = {
  name: string;
  color: CategoryColor;
};

/**
 * Creates a custom category. If the name matches a built-in category the user
 * previously deleted, that built-in is restored instead.
 */
export const createCategory = async ({ name, color }: CreateCategoryArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }
  if (!isCategoryColor(color)) {
    throw new Error('Invalid category color');
  }

  const records = await queryMyCategories(user.id);
  const normalizedName = normalizeCategoryName(name);
  const duplicateError = findDuplicateCategoryName({
    name: normalizedName,
    options: mergeCategoryOptions(records),
  });

  if (duplicateError) {
    throw new Error(duplicateError);
  }

  const now = new Date().toISOString();
  const hiddenBuiltIn = findHiddenBuiltInCategoryByName(
    normalizedName,
    records
  );

  if (hiddenBuiltIn) {
    await db.transact([
      tx.categories[hiddenBuiltIn.id].update(
        trimStringFields({
          name: normalizedName,
          color,
          isHidden: false,
          updatedAt: now,
        })
      ),
    ]);
    return { id: hiddenBuiltIn.id, value: hiddenBuiltIn.value };
  }

  const categoryId = id();
  const categoryValue = getUniqueCategoryValue(normalizedName, records);

  await db.transact([
    tx.categories[categoryId].update(
      trimStringFields({
        name: normalizedName,
        value: categoryValue,
        color,
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
