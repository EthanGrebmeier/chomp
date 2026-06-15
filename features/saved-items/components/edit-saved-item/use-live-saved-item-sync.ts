import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

import { useItemSheet } from '../../../../components/item-sheet/use-item-sheet';
import { UnifiedSavedItem } from '../../types';
import { updateSavedItem } from '../../unified/update-saved-item';

import {
  diffSavedItemSnapshot,
  SavedItemSnapshot,
} from './diff-saved-item-snapshot';

const DEBOUNCE_MS = 300;

export type LiveSavedItemSyncHandle = {
  captureSnapshot: (item: UnifiedSavedItem) => void;
  flushAndSyncOnClose: () => void;
  clearSnapshot: () => void;
};

export type UseLiveSavedItemSyncArgs = {
  editingItem: UnifiedSavedItem | null;
  onPromoteToCloud?: (item: UnifiedSavedItem) => void;
  handleRef?: RefObject<LiveSavedItemSyncHandle | null>;
};

export const useLiveSavedItemSync = ({
  editingItem,
  onPromoteToCloud,
  handleRef,
}: UseLiveSavedItemSyncArgs): LiveSavedItemSyncHandle => {
  const { itemInputValue, itemInputValueRef, category, storeId } =
    useItemSheet();

  const snapshotRef = useRef<SavedItemSnapshot | null>(null);
  const currentStoreIdRef = useRef<string | undefined>(editingItem?.storeId);
  const editingItemRef = useRef<UnifiedSavedItem | null>(editingItem);

  // Keep the stable callbacks below reading fresh values without forcing
  // debounced callback re-subscription on every keystroke.
  const stateRef = useRef({
    category,
    storeId,
  });
  stateRef.current = {
    category,
    storeId,
  };

  useEffect(() => {
    editingItemRef.current = editingItem;
    currentStoreIdRef.current = editingItem?.storeId;
  }, [editingItem]);

  const buildCurrent = useCallback((): SavedItemSnapshot => {
    const state = stateRef.current;
    return {
      name: itemInputValueRef.current,
      category: state.category,
      storeId: state.storeId,
    };
  }, [itemInputValueRef]);

  const commit = useCallback(() => {
    const snapshot = snapshotRef.current;
    const currentEditingItem = editingItemRef.current;
    if (!snapshot || !currentEditingItem) return;

    const current = buildCurrent();
    if (!current.name.trim()) return;

    const diff = diffSavedItemSnapshot({ snapshot, current });
    if (Object.keys(diff).length === 0) return;

    const storeIdChanged = 'storeId' in diff;

    void updateSavedItem({
      item: currentEditingItem,
      updates: {
        name: current.name,
        category: current.category,
        storeId: current.storeId,
      },
      currentStoreId: currentStoreIdRef.current,
    }).then((result) => {
      snapshotRef.current = current;
      if (storeIdChanged) {
        currentStoreIdRef.current = current.storeId;
      }

      if (!result.promoted) return;

      const promotedItem: UnifiedSavedItem = {
        ...currentEditingItem,
        id: result.id,
        source: 'cloud',
      };
      editingItemRef.current = promotedItem;
      onPromoteToCloud?.(promotedItem);
    });
  }, [buildCurrent, onPromoteToCloud]);

  const debouncedCommit = useDebounceCallback(commit, DEBOUNCE_MS);

  useEffect(() => {
    if (!snapshotRef.current) return;
    commit();
  }, [category, storeId, commit]);

  useEffect(() => {
    if (!snapshotRef.current) return;
    debouncedCommit();
  }, [itemInputValue, debouncedCommit]);

  const captureSnapshot = useCallback((item: UnifiedSavedItem) => {
    editingItemRef.current = item;
    currentStoreIdRef.current = item.storeId;
    snapshotRef.current = {
      name: item.name ?? '',
      category: item.category ?? undefined,
      storeId: item.storeId,
    };
  }, []);

  const flushAndSyncOnClose = useCallback(() => {
    debouncedCommit.flush();
    commit();
  }, [debouncedCommit, commit]);

  const clearSnapshot = useCallback(() => {
    snapshotRef.current = null;
    currentStoreIdRef.current = undefined;
    debouncedCommit.cancel();
  }, [debouncedCommit]);

  const handle = useMemo<LiveSavedItemSyncHandle>(
    () => ({
      captureSnapshot,
      flushAndSyncOnClose,
      clearSnapshot,
    }),
    [captureSnapshot, flushAndSyncOnClose, clearSnapshot]
  );

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
