import { Recipe } from '../recipes/types';
import { Item } from '../shared/types';
import {
  GroceryList,
  GroceryListItem,
  GroceryListItemWithItem,
  GroceryListWithItems,
} from './types';

export const normalizeGroceryList = (
  dbResult: {
    grocery_list: GroceryList;
    grocery_list_item: GroceryListItem | null;
    item: Item | null;
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
    if (curr.grocery_list_item && curr.item) {
      const itemWithItem: GroceryListItemWithItem = {
        ...curr.grocery_list_item,
        item: curr.item,
        recipe: curr.recipe || null,
      };
      acc[curr.grocery_list.id].items.push(itemWithItem);
    }
    return acc;
  }, {});
};

export const groupItemsBy = (
  items: GroceryListItemWithItem[],
  groupBy: 'category' | 'none'
): Map<string, GroceryListItemWithItem[]> => {
  const groups = new Map<string, GroceryListItemWithItem[]>();

  if (groupBy === 'none') {
    // Sort items: unchecked first, then alphabetically by name
    const sortedItems = items.sort((a, b) => {
      // First sort by checked status: unchecked items first
      if (a.isChecked && !b.isChecked) return 1;
      if (!a.isChecked && b.isChecked) return -1;

      // Then sort alphabetically by name
      return a.item.name.localeCompare(b.item.name, undefined, {
        sensitivity: 'base',
      });
    });
    groups.set('', sortedItems);
    return groups;
  }

  if (groupBy === 'category') {
    items.forEach(item => {
      const category = item.item.category || 'Uncategorized';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });
  }

  // Sort items within each group: unchecked first, then alphabetically
  groups.forEach(groupItems => {
    groupItems.sort((a, b) => {
      // First sort by checked status: unchecked items first
      if (a.isChecked && !b.isChecked) return 1;
      if (!a.isChecked && b.isChecked) return -1;

      // Then sort alphabetically by name
      return a.item.name.localeCompare(b.item.name, undefined, {
        sensitivity: 'base',
      });
    });
  });

  // Convert to array, sort groups to put Uncategorized at the bottom, then back to Map
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  const sortedGroupsMap = new Map(sortedGroups);
  return sortedGroupsMap;
};
