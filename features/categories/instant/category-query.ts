import { db } from '../../../lib/instant';
import { isCategoryColor } from '../../shared/category/category-colors';
import { CategoryRecord } from '../types';

type RawCategory = {
  id: string;
  name: string;
  value: string;
  color?: string | null;
  isHidden?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export const toCategoryRecord = (category: RawCategory): CategoryRecord => ({
  id: category.id,
  name: category.name,
  value: category.value,
  color: isCategoryColor(category.color) ? category.color : undefined,
  isHidden: category.isHidden ?? undefined,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

export const queryMyCategories = async (
  userId: string
): Promise<CategoryRecord[]> => {
  const result = await db.queryOnce({
    categories: {
      user: {},
    },
  });

  return (result.data.categories ?? [])
    .filter(category => category.user?.id === userId)
    .map(toCategoryRecord);
};
