import { Recipe } from '../recipes/types';
import {
  GroceryList,
  GroceryListItem,
  GroceryListItemWithRecipe,
  GroceryListWithItems,
} from './types';

export const normalizeGroceryList = (
  dbResult: {
    grocery_list: GroceryList;
    grocery_list_item: GroceryListItem | null;
    recipe: Recipe | null;
  }[]
) => {
  return dbResult.reduce<Record<string, GroceryListWithItems>>((acc, curr) => {
    if (!acc[curr.grocery_list.id]) {
      acc[curr.grocery_list.id] = {
        ...curr.grocery_list,
        items: [],
      };
    }
    if (curr.grocery_list_item) {
      const itemWithRecipe: GroceryListItemWithRecipe = {
        ...curr.grocery_list_item,
        recipe: curr.recipe || null,
      };
      acc[curr.grocery_list.id].items.push(itemWithRecipe);
    }
    return acc;
  }, {});
};

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
  groupBy: 'category' | 'none' | 'recipe',
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
      const category = item.category || 'Uncategorized';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });
  }

  if (groupBy === 'recipe') {
    items.forEach(item => {
      const recipeName = item.recipe?.name || 'Ungrouped';
      if (!groups.has(recipeName)) {
        groups.set(recipeName, []);
      }
      groups.get(recipeName)!.push(item);
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
  } else {
    // For 'none' grouping, no additional sorting needed
    sortedGroups = Array.from(groups.entries());
  }

  const sortedGroupsMap = new Map(sortedGroups);
  return sortedGroupsMap;
};
