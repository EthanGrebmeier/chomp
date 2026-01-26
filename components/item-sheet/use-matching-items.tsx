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

    const lowerValue = value.toLowerCase();

    return savedItems
      .filter(item => item.name.toLowerCase().includes(lowerValue))
      .sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();
        const aIndex = aLower.indexOf(lowerValue);
        const bIndex = bLower.indexOf(lowerValue);

        // Exact match comes first
        if (aLower === lowerValue && bLower !== lowerValue) return -1;
        if (bLower === lowerValue && aLower !== lowerValue) return 1;

        // Then by position of match (earlier = better)
        if (aIndex !== bIndex) return aIndex - bIndex;

        // Then alphabetically
        return aLower.localeCompare(bLower);
      })
      .slice(0, 7)
      .map(
        (item): BaseGroceryItem => ({
          name: item.name,
          category: item.category,
          quantity: 1,
          unit: 'each',
          storeId: item.storeId,
        })
      );
  }, [savedItems, value]);

  return { matchingItems };
};
