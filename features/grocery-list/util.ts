import { GroceryListItemWithRecipe } from './types';

const sortItems = (
  items: GroceryListItemWithRecipe[],
  sortBy: 'name' | 'recent'
): GroceryListItemWithRecipe[] => {
  return [...items].sort((a, b) => {
    // First sort by checked status: unchecked items first
    if (a.isChecked && !b.isChecked) return 1;
    if (!a.isChecked && b.isChecked) return -1;

    if (sortBy === 'recent') {
      // Sort by most recent first (based on createdAt)
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    } else {
      // Sort alphabetically by name
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
      });
    }
  });
};

export const groupItemsBy = (
  items: GroceryListItemWithRecipe[],
  groupBy: 'category' | 'none' | 'recipe' | 'store',
  sortBy: 'name' | 'recent' = 'recent'
): Map<string, GroceryListItemWithRecipe[]> => {
  const groups = new Map<string, GroceryListItemWithRecipe[]>();

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
      const storeName = item.store?.name ?? 'No Store';
      if (!groups.has(storeName)) {
        groups.set(storeName, []);
      }
      groups.get(storeName)!.push(item);
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
      if (a === 'No Store') return 1;
      if (b === 'No Store') return -1;
      return a.localeCompare(b);
    });
  } else {
    // For 'none' grouping, no additional sorting needed
    sortedGroups = Array.from(groups.entries());
  }

  const sortedGroupsMap = new Map(sortedGroups);
  return sortedGroupsMap;
};
