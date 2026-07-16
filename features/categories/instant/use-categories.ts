import { db } from '../../../lib/instant';
import { isCategoryColor } from '../../shared/category/category-colors';
import { CustomCategory } from '../types';

export const useCategories = () => {
  const { user } = db.useAuth();

  const result = db.useQuery({
    categories: {
      user: {},
    },
  });

  const categories = result.data?.categories;
  const myCategories = (categories ?? []).reduce<CustomCategory[]>(
    (ownedCategories, category) => {
      if (category.user?.id === user?.id) {
        ownedCategories.push({
          id: category.id,
          name: category.name,
          value: category.value,
          color: isCategoryColor(category.color) ? category.color : undefined,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        });
      }
      return ownedCategories;
    },
    []
  );

  if (!user) {
    return {
      data: [],
      isLoading: false,
      error: null,
    };
  }

  return {
    ...result,
    data: myCategories,
  };
};
