import { db } from '../../../lib/instant';
import { CategoryRecord } from '../types';

import { toCategoryRecord } from './category-query';

/** The signed-in user's persisted category records (custom + overrides). */
export const useCategories = () => {
  const { user } = db.useAuth();

  const result = db.useQuery({
    categories: {
      user: {},
    },
  });

  const categories = result.data?.categories;
  const myCategories = (categories ?? []).reduce<CategoryRecord[]>(
    (ownedCategories, category) => {
      if (category.user?.id === user?.id) {
        ownedCategories.push(toCategoryRecord(category));
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
