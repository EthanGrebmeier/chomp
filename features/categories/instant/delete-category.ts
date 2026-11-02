import { tx } from '@instantdb/react-native';

import { transactLocally } from '@/lib/instant/local-transaction';

import { CategoryOption } from '../../shared/category/categories';

import { updateCategory } from './update-category';

type DeleteCategoryArgs = {
  category: Pick<
    CategoryOption,
    'id' | 'value' | 'label' | 'color' | 'isBuiltIn'
  >;
};

/**
 * Removes a category from the user's list. Built-in categories can't be
 * deleted outright, so they are hidden via an override record; custom
 * categories are deleted. Items keep their category value either way.
 */
export const deleteCategory = async ({ category }: DeleteCategoryArgs) => {
  if (category.isBuiltIn) {
    await updateCategory({ category, updates: { isHidden: true } });
    return;
  }

  if (!category.id) {
    throw new Error('Category not found');
  }

  await transactLocally([tx.categories[category.id].delete()]);
};
