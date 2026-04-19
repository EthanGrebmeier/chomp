import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

import { syncSavedItemFromGroceryItem } from '../../../features/grocery-list/instant/sync-saved-item-from-grocery-item';
import { updateGroceryItemOnly } from '../../../features/grocery-list/instant/update-grocery-item-only';
import { GroceryListItemWithRecipe } from '../../../features/grocery-list/types';
import { ItemSnapshot, diffItemSnapshot } from '../diff-item-snapshot';
import { useItemSheet } from '../use-item-sheet';

// Fields on the grocery item that fan out into the linked saved_item surface.
// A diff against any of these triggers the close-time saved-item sync; a diff
// limited to quantity/unit alone does not.
const SAVED_ITEM_RELEVANT_FIELDS = [
  'name',
  'category',
  'notes',
  'storeId',
] as const;

const DEBOUNCE_MS = 300;

export type UseLiveItemSyncArgs = {
  selectedItemId: string | null;
  currentStoreId: string | undefined;
  currentSavedItemId: string | undefined;
  currentSavedItemOwnerId: string | undefined;
  currentSavedItemStoreId: string | undefined;
  currentItemName: string | undefined;
  /**
   * Optional ref the hook will keep pointed at its imperative handle so the
   * ancestor component (EditItemProvider) can call captureSnapshot / flush
   * / clear from outside the ItemSheetProvider subtree.
   */
  handleRef?: RefObject<UseLiveItemSyncHandle | null>;
};

export type UseLiveItemSyncHandle = {
  /**
   * Capture the presented item's field values so later edits can be diffed
   * against a stable baseline. Called from EditItemProvider.present().
   */
  captureSnapshot: (item: GroceryListItemWithRecipe) => void;
  /**
   * Forget the baseline and cancel any pending debounced write. Called when
   * the sheet is fully dismissed (or before presenting a different item).
   */
  clearSnapshot: () => void;
  /**
   * Flush any pending text-field debounce synchronously, then — if any
   * saved-item-relevant field (name, category, notes, storeId) has diverged
   * from the snapshot — run the close-time saved-item sync.
   */
  flushAndSyncOnClose: () => void;
};

/**
 * Drives the Edit Item sheet's live-update behavior:
 *
 *   - Captures a snapshot of the item on present() so later edits can be
 *     diffed against a stable baseline.
 *   - Fires immediate updateGroceryItemOnly writes on category / quantity /
 *     unit / storeId changes.
 *   - Debounces name / notes changes at a 300ms trailing edge.
 *   - Skips writes entirely while the current name is empty.
 *   - Exposes flushAndSyncOnClose so the sheet can flush the pending
 *     debounce and commit the close-time saved-item sync on dismissal.
 *
 * The hook deliberately stays side-effect-only and returns an imperative
 * handle; it never triggers re-renders of its host.
 */
export const useLiveItemSync = ({
  selectedItemId,
  currentStoreId,
  currentSavedItemId,
  currentSavedItemOwnerId,
  currentSavedItemStoreId,
  currentItemName,
  handleRef,
}: UseLiveItemSyncArgs): UseLiveItemSyncHandle => {
  const { itemInputValue, notesInputValue, category, quantity, unit, storeId } =
    useItemSheet();

  const snapshotRef = useRef<ItemSnapshot | null>(null);

  // Mirror the latest props/state into a ref so the stable callbacks below
  // (captured once and held by useDebounceCallback / the imperative handle)
  // always read the freshest values without resubscribing.
  const stateRef = useRef({
    selectedItemId,
    itemInputValue,
    notesInputValue,
    category,
    quantity,
    unit,
    storeId,
    currentStoreId,
    currentSavedItemId,
    currentSavedItemOwnerId,
    currentSavedItemStoreId,
    currentItemName,
  });
  stateRef.current = {
    selectedItemId,
    itemInputValue,
    notesInputValue,
    category,
    quantity,
    unit,
    storeId,
    currentStoreId,
    currentSavedItemId,
    currentSavedItemOwnerId,
    currentSavedItemStoreId,
    currentItemName,
  };

  const buildCurrent = useCallback((): ItemSnapshot => {
    const s = stateRef.current;
    return {
      name: s.itemInputValue,
      category: s.category,
      notes: s.notesInputValue,
      quantity: s.quantity,
      unit: s.unit,
      storeId: s.storeId,
    };
  }, []);

  const commitGroceryItemLive = useCallback(() => {
    const snapshot = snapshotRef.current;
    if (!snapshot) return;
    const state = stateRef.current;
    if (!state.selectedItemId) return;
    // Treat a temporarily-cleared name as "don't touch it yet"; the user is
    // mid-edit and an empty name would otherwise corrupt the item row.
    if (!state.itemInputValue.trim()) return;

    const current = buildCurrent();
    const diff = diffItemSnapshot({ snapshot, current });
    if (Object.keys(diff).length === 0) return;

    // Writers expect the full current field payload (they reconcile against
    // currentStoreId / currentSavedItemId internally). The diff above is only
    // used to decide *whether* to write.
    updateGroceryItemOnly({
      itemId: state.selectedItemId,
      item: {
        name: current.name,
        category: current.category,
        notes: current.notes,
        quantity: current.quantity,
        unit: current.unit,
        storeId: current.storeId,
      },
      currentStoreId: state.currentStoreId,
      currentSavedItemId: state.currentSavedItemId,
    });
  }, [buildCurrent]);

  const debouncedCommit = useDebounceCallback(
    commitGroceryItemLive,
    DEBOUNCE_MS
  );

  // Immediate writes for non-text fields. commitGroceryItemLive is stable
  // (it reads everything via stateRef), so this effect only fires when one
  // of category / quantity / unit / storeId actually changes.
  useEffect(() => {
    if (!snapshotRef.current) return;
    commitGroceryItemLive();
  }, [category, quantity, unit, storeId, commitGroceryItemLive]);

  // Debounced writes for text fields.
  useEffect(() => {
    if (!snapshotRef.current) return;
    debouncedCommit();
  }, [itemInputValue, notesInputValue, debouncedCommit]);

  const captureSnapshot = useCallback((item: GroceryListItemWithRecipe) => {
    snapshotRef.current = {
      name: item.name,
      category: item.category,
      notes: item.notes,
      quantity: item.quantity,
      unit: item.unit,
      // Match setFromItem's precedence so the snapshot lines up with the
      // form state the provider pushes in alongside this call.
      storeId: item.store?.id ?? item.saved_item?.store?.id,
    };
  }, []);

  const clearSnapshot = useCallback(() => {
    snapshotRef.current = null;
    debouncedCommit.cancel();
  }, [debouncedCommit]);

  const flushAndSyncOnClose = useCallback(() => {
    const state = stateRef.current;
    if (!state.selectedItemId) {
      debouncedCommit.cancel();
      return;
    }

    // Run any pending text-field write now. This may fire updateGroceryItemOnly
    // via commitGroceryItemLive before the saved-item sync below, matching the
    // AC-required "updateGroceryItemOnly then syncSavedItemFromGroceryItem" order.
    debouncedCommit.flush();

    const snapshot = snapshotRef.current;
    if (!snapshot) return;

    const current = buildCurrent();
    // Don't commit an empty name: keeps behavior consistent with the live
    // path and with Story 7 ("empty name does not write").
    if (!current.name.trim()) return;

    const diff = diffItemSnapshot({ snapshot, current });
    // Skip the saved-item sync entirely when either nothing changed or only
    // non-saved-item fields changed (e.g. quantity). This keeps the cloud
    // saved_items row untouched for edits the sync has no business propagating.
    const hasSavedItemRelevantDiff = SAVED_ITEM_RELEVANT_FIELDS.some(
      (field) => field in diff
    );
    if (!hasSavedItemRelevantDiff) return;

    // Pass the current saved-item-relevant field values. For the cloud path,
    // only the diffed values deviate from what's already stored, so re-writing
    // un-diffed fields is a no-op at the row level. For the local path,
    // upsertLocalSavedItem needs the full field set to avoid nulling columns
    // that weren't part of the diff.
    syncSavedItemFromGroceryItem({
      item: {
        name: current.name,
        category: current.category,
        notes: current.notes,
        storeId: current.storeId,
      },
      nextSavedItemId: state.currentSavedItemId,
      currentSavedItemOwnerId: state.currentSavedItemOwnerId,
      savedItemStoreId: state.currentSavedItemStoreId,
      currentItemName: state.currentItemName,
    });
  }, [buildCurrent, debouncedCommit]);

  const handle = useMemo<UseLiveItemSyncHandle>(
    () => ({
      captureSnapshot,
      clearSnapshot,
      flushAndSyncOnClose,
    }),
    [captureSnapshot, clearSnapshot, flushAndSyncOnClose]
  );

  // Keep the caller's ref pointed at the latest handle so EditItemProvider
  // (outside the ItemSheetProvider subtree) can call into the hook's
  // imperative surface without prop-drilling.
  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = handle;
    return () => {
      if (handleRef.current === handle) {
        handleRef.current = null;
      }
    };
  }, [handle, handleRef]);

  return handle;
};
