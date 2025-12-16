import { useMemo } from 'react';

import { BaseGroceryItem } from '../../features/grocery-list/types';
import { useUnifiedSavedItems } from '../../features/saved-items/unified/use-unified-saved-items';

export const useMatchingItems = (
  value: string
): { matchingItems: BaseGroceryItem[] } => {
  const { data: savedItems } = useUnifiedSavedItems();

  const matchingItems = useMemo((): BaseGroceryItem[] => {
    if (value.length === 0) {
      return [];
    }

    return savedItems
      .filter(item => item.name.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 7)
      .sort((a, b) => b.name.localeCompare(a.name))
      .map(
        (item): BaseGroceryItem => ({
          name: item.name,
          category: item.category,
          quantity: 1,
          unit: 'each',
        })
      );
  }, [savedItems, value]);

  return { matchingItems };
};
