import { useMemo } from 'react';

import { db } from '../../../lib/instant';
import { CategoryRecord } from '../types';

import { toCategoryRecord } from './category-query';

const EMPTY_CATEGORIES: CategoryRecord[] = [];

/** The signed-in user's persisted category records (custom + overrides). */
export const useCategories = () => {
  const { user } = db.useAuth();

  const result = db.useQuery({
    categories: {
      user: {},
    },
  });

  const categories = result.data?.categories;
  const userId = user?.id;
  const myCategories = useMemo(() => {
    if (!userId || !categories) {
      return EMPTY_CATEGORIES;
    }

    return categories.reduce<CategoryRecord[]>((ownedCategories, category) => {
      if (category.user?.id === userId) {
        ownedCategories.push(toCategoryRecord(category));
      }
      return ownedCategories;
    }, []);
  }, [categories, userId]);

  if (!user) {
    return {
      data: EMPTY_CATEGORIES,
      isLoading: false,
      error: null,
    };
  }

  return {
    ...result,
    data: myCategories,
  };
};
