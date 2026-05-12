type SelectableGroceryItem = {
  id: string;
  isChecked: boolean;
};

export type BulkSelectionState = {
  isActive: boolean;
  selectedItemIds: Set<string>;
};

export const createBulkSelectionState = (): BulkSelectionState => ({
  isActive: false,
  selectedItemIds: new Set(),
});

export const enterBulkSelectionMode = (
  _state: BulkSelectionState
): BulkSelectionState => ({
  isActive: true,
  selectedItemIds: new Set(),
});

export const exitBulkSelectionMode = (
  _state: BulkSelectionState
): BulkSelectionState => ({
  isActive: false,
  selectedItemIds: new Set(),
});

export const toggleBulkSelectionItem = (
  state: BulkSelectionState,
  item: SelectableGroceryItem
): BulkSelectionState => {
  if (!state.isActive || item.isChecked) {
    return state;
  }

  const nextSelected = new Set(state.selectedItemIds);

  if (nextSelected.has(item.id)) {
    nextSelected.delete(item.id);
  } else {
    nextSelected.add(item.id);
  }

  return {
    ...state,
    selectedItemIds: nextSelected,
  };
};

export const selectAllVisibleUncheckedItems = (
  state: BulkSelectionState,
  visibleItems: SelectableGroceryItem[]
): BulkSelectionState => {
  if (!state.isActive) {
    return state;
  }

  return {
    ...state,
    selectedItemIds: new Set(
      visibleItems.filter(item => !item.isChecked).map(item => item.id)
    ),
  };
};

export const clearBulkSelection = (
  state: BulkSelectionState
): BulkSelectionState => {
  if (!state.isActive || state.selectedItemIds.size === 0) {
    return state;
  }

  return {
    ...state,
    selectedItemIds: new Set(),
  };
};
