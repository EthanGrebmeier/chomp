import { useMemo } from 'react';

import { mealProjection } from '@/features/quantity/app/projection';
import { useQuantityList } from '@/features/quantity/app/session';
import { db } from '@/lib/instant';

export const useUserMealPlanData = (listId?: string) => {
  const quantity = useQuantityList(listId);
  const sources = db.useQuery({
    stores: {},
    recipes: { recipe_ingredients: { store: {} }, user: {} },
  });
  const projected = useMemo(
    () =>
      mealProjection(
        quantity.state,
        sources.data?.stores,
        sources.data?.recipes
      ),
    [quantity.state, sources.data]
  );
  return {
    recipes: projected.recipes,
    items: projected.items,
    isLoading: listId ? quantity.loading : false,
    error: quantity.error ? { message: quantity.error } : null,
  };
};
