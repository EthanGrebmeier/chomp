import {
  GroceryListGroupBy,
  GroceryListItemWithRecipe,
  GroceryListSortBy,
} from './types';

const normalizeGroupToken = (value?: string | null): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const compareOptionalLabels = (
  aValue: string | null | undefined,
  bValue: string | null | undefined,
  fallbackLabel: string
) => {
  const aLabel = aValue?.trim() || fallbackLabel;
  const bLabel = bValue?.trim() || fallbackLabel;
  const aIsFallback = aLabel === fallbackLabel;
  const bIsFallback = bLabel === fallbackLabel;

  if (aIsFallback && !bIsFallback) return 1;
  if (!aIsFallback && bIsFallback) return -1;

  return aLabel.localeCompare(bLabel, undefined, {
    sensitivity: 'base',
  });
};

export const sortItems = (
  items: GroceryListItemWithRecipe[],
  sortBy: GroceryListSortBy
): GroceryListItemWithRecipe[] => {
  return [...items].sort((a, b) => {
    if (sortBy === 'recent') {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    }

    if (sortBy === 'category') {
      const categoryComparison = compareOptionalLabels(
        a.category,
        b.category,
        'Uncategorized'
      );
      if (categoryComparison !== 0) return categoryComparison;
    }

    if (sortBy === 'recipe') {
      const recipeComparison = compareOptionalLabels(
        a.recipe?.name,
        b.recipe?.name,
        'Ungrouped'
      );
      if (recipeComparison !== 0) return recipeComparison;
    }

    if (sortBy === 'store') {
      const storeComparison = compareOptionalLabels(
        a.store?.name,
        b.store?.name,
        'No Store'
      );
      if (storeComparison !== 0) return storeComparison;
    }

    return a.name.localeCompare(b.name, undefined, {
      sensitivity: 'base',
    });
  });
};

export const groupItemsBy = (
  items: GroceryListItemWithRecipe[],
  groupBy: GroceryListGroupBy,
  sortBy: GroceryListSortBy = 'recent'
): Map<string, GroceryListItemWithRecipe[]> => {
  const groups = new Map<string, GroceryListItemWithRecipe[]>();
  const storeDisplayByKey = new Map<string, string>();

  if (groupBy === 'none') {
    // Sort items based on sortBy parameter
    const sortedItems = sortItems(items, sortBy);
    groups.set('', sortedItems);
    return groups;
  }

  if (groupBy === 'category') {
    items.forEach(item => {
      const category = item.category ?? 'Uncategorized';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });
  }

  if (groupBy === 'recipe') {
    items.forEach(item => {
      const recipeName = item.recipe?.name ?? 'Ungrouped';
      if (!groups.has(recipeName)) {
        groups.set(recipeName, []);
      }
      groups.get(recipeName)!.push(item);
    });
  }

  if (groupBy === 'store') {
    items.forEach(item => {
      const storeName = item.store?.name?.trim() || 'No Store';
      const storeKey = item.store?.name
        ? normalizeGroupToken(item.store.name)
        : 'No Store';
      if (!groups.has(storeKey)) {
        groups.set(storeKey, []);
        storeDisplayByKey.set(storeKey, storeName);
      }
      groups.get(storeKey)!.push(item);
    });
  }

  // Sort items within each group based on sortBy parameter
  for (const [key, groupItems] of groups.entries()) {
    groups.set(key, sortItems(groupItems, sortBy));
  }

  // Convert to array, sort groups based on grouping type
  let sortedGroups: [string, GroceryListItemWithRecipe[]][];

  if (groupBy === 'category') {
    // Sort category groups: put Uncategorized at the bottom, others alphabetically
    sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
  } else if (groupBy === 'recipe') {
    // Sort recipe groups: put Ungrouped at the bottom, others chronologically by earliest item
    sortedGroups = Array.from(groups.entries()).sort(
      ([a, aItems], [b, bItems]) => {
        if (a === 'Ungrouped') return 1;
        if (b === 'Ungrouped') return -1;

        // Find the earliest item in each group (by item creation time)
        const aEarliest = Math.min(
          ...aItems.map(item => new Date(item.createdAt).getTime())
        );
        const bEarliest = Math.min(
          ...bItems.map(item => new Date(item.createdAt).getTime())
        );

        return aEarliest - bEarliest;
      }
    );
  } else if (groupBy === 'store') {
    // Sort store groups: put No Store at the bottom, others alphabetically
    sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
      const aLabel = storeDisplayByKey.get(a) ?? a;
      const bLabel = storeDisplayByKey.get(b) ?? b;
      if (aLabel === 'No Store') return 1;
      if (bLabel === 'No Store') return -1;
      return aLabel.localeCompare(bLabel, undefined, { sensitivity: 'base' });
    });
  } else {
    // For 'none' grouping, no additional sorting needed
    sortedGroups = Array.from(groups.entries());
  }

  const sortedGroupsMap =
    groupBy === 'store'
      ? new Map(
          sortedGroups.map(([key, groupItems]) => [
            storeDisplayByKey.get(key) ?? key,
            groupItems,
          ])
        )
      : new Map(sortedGroups);
  return sortedGroupsMap;
};
