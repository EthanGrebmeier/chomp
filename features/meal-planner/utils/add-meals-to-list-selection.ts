type MealPlanSelectionIds = {
  recipeIds: Iterable<string>;
  itemIds: Iterable<string>;
  deselectedIds: ReadonlySet<string>;
};

export type AddMealsToListSelection = {
  selectedRecipeIds: string[];
  skippedRecipeIds: string[];
  selectedItemIds: string[];
  skippedItemIds: string[];
};

export function getAddMealsToListSelection({
  recipeIds,
  itemIds,
  deselectedIds,
}: MealPlanSelectionIds): AddMealsToListSelection {
  const partition = (ids: Iterable<string>) => {
    const selected: string[] = [];
    const skipped: string[] = [];

    for (const id of ids) {
      if (deselectedIds.has(id)) {
        skipped.push(id);
      } else {
        selected.push(id);
      }
    }

    return { selected, skipped };
  };

  const recipes = partition(recipeIds);
  const items = partition(itemIds);

  return {
    selectedRecipeIds: recipes.selected,
    skippedRecipeIds: recipes.skipped,
    selectedItemIds: items.selected,
    skippedItemIds: items.skipped,
  };
}
