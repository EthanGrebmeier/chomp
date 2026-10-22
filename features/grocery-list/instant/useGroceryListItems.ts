import { useMemo } from 'react';

import { createGroceryProjector } from '@/features/quantity/app/projection';
import { useQuantityList } from '@/features/quantity/app/session';

import { db } from '../../../lib/instant';

/** Contribution-backed items for one list, including optimistic checkbox state. */
export const useGroceryListItems = (listId: string | undefined) => {
  const quantity = useQuantityList(listId);
  const stores = db.useQuery({ stores: {} });
  const project = useMemo(() => createGroceryProjector(), []);
  const projected = useMemo(
    () => project(quantity.state, stores.data?.stores),
    [project, quantity.state, stores.data]
  );
  return {
    items: projected,
    isLoading: listId ? quantity.loading : false,
    error: quantity.error ? { message: quantity.error } : null,
  };
};
