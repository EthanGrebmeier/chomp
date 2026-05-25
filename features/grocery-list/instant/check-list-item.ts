import {
  CheckedStateUpdate,
  updateGroceryItemsCheckedState,
} from './update-grocery-item-only';
type CheckListItemArgs = {
  itemId: string;
  isChecked: boolean;
};

const CHECK_STATE_FLUSH_DELAY_MS = 1000;

let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const pendingCheckedStateUpdates = new Map<string, boolean>();

const flushCheckedStateUpdates = async () => {
  flushTimeout = null;

  const updates: CheckedStateUpdate[] = Array.from(
    pendingCheckedStateUpdates.entries()
  ).map(([itemId, isChecked]) => ({
    itemId,
    isChecked,
  }));

  pendingCheckedStateUpdates.clear();

  if (updates.length === 0) {
    return;
  }

  try {
    await updateGroceryItemsCheckedState(updates);
  } catch (error) {
    console.error('Failed to batch update grocery item checked states', error);
  }
};

export const checkListItem = ({ itemId, isChecked }: CheckListItemArgs) => {
  pendingCheckedStateUpdates.set(itemId, isChecked);

  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }

  flushTimeout = setTimeout(() => {
    void flushCheckedStateUpdates();
  }, CHECK_STATE_FLUSH_DELAY_MS);
};
