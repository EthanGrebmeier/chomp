import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

import { useItemSheet } from '../../../../components/item-sheet/use-item-sheet';
import { MatchingItem } from '../../../../components/item-sheet/use-matching-items';
import { updateRecipeIngredient } from '../../instant/update-recipe-ingredient';
import { RecipeIngredient } from '../../types';

import {
  IngredientSnapshot,
  diffIngredientSnapshot,
} from './diff-ingredient-snapshot';

const DEBOUNCE_MS = 300;

export type UseLiveIngredientSyncArgs = {
  selectedIngredientId: string | null;
  currentStoreId: string | undefined;
  /**
   * Optional ref the hook keeps pointed at its imperative handle so the
   * ancestor component (AddIngredientProvider) can call captureSnapshot /
   * flush / clearSnapshot / onPickMatch from outside the ItemSheetProvider
   * subtree.
   */
  handleRef?: RefObject<LiveIngredientSyncHandle | null>;
};

export type LiveIngredientSyncHandle = {
  /**
   * Capture the presented ingredient's field values so later edits can be
   * diffed against a stable baseline. Called from
   * AddIngredientProvider.present() in the edit branch.
   */
  captureSnapshot: (ingredient: RecipeIngredient) => void;
  /**
   * Flush any pending text-field debounce synchronously. Called on sheet
   * close so the last few keystrokes aren't lost to dismissal.
   */
  flush: () => void;
  /**
   * Forget the baseline and cancel any pending debounced write. Called when
   * the sheet is fully dismissed (or before presenting a different
   * ingredient).
   */
  clearSnapshot: () => void;
  /**
   * Autocomplete pick handler. Cancels any pending text-field debounce,
   * fires an immediate updateRecipeIngredient with the picked fields
   * (preserving the form's current quantity), and rebases the snapshot (and
   * currentStoreIdRef) to the picked target so subsequent edits diff
   * against the post-pick state.
   */
  onPickMatch: (match: MatchingItem) => void;
};

/**
 * Drives the Recipe Ingredient sheet's live-update behavior in edit mode:
 *
 *   - Captures a snapshot of the ingredient on present() so later edits can
 *     be diffed against a stable baseline.
 *   - Fires immediate updateRecipeIngredient writes on category / quantity /
 *     unit / storeId changes.
 *   - Debounces name / notes changes at a 300ms trailing edge.
 *   - Skips writes entirely when the form is not valid (empty trimmed name,
 *     zero quantity, or empty unit) so an intermediate invalid state can't
 *     corrupt the ingredient row.
 *   - Exposes an imperative handle so the host provider can capture the
 *     snapshot on present, flush the debounce on close, clear state on
 *     dismiss, and (in P2) route autocomplete picks through onPickMatch.
 *
 * The hook is deliberately side-effect-only and returns an imperative
 * handle; it never triggers re-renders of its host.
 */
export const useLiveIngredientSync = ({
  selectedIngredientId,
  currentStoreId,
  handleRef,
}: UseLiveIngredientSyncArgs): LiveIngredientSyncHandle => {
  const {
    itemInputValue,
    notesInputValue,
    itemInputValueRef,
    notesInputValueRef,
    category,
    quantity,
    unit,
    storeId,
    isValid,
  } = useItemSheet();

  const snapshotRef = useRef<IngredientSnapshot | null>(null);
  // Tracks the store the ingredient is currently linked to. Seeded from the
  // ingredient on captureSnapshot and updated after any successful live
  // write that moved storeId, so linkStoreToIngredient always reconciles
  // against the real linked store (not the pre-present baseline).
  const currentStoreIdRef = useRef<string | undefined>(currentStoreId);

  // Mirror the latest props/form state into a ref so the stable callbacks
  // below (captured once and held by useDebounceCallback / the imperative
  // handle) always read the freshest values without re-subscribing.
  const stateRef = useRef({
    selectedIngredientId,
    category,
    quantity,
    unit,
    storeId,
    isValid,
  });
  stateRef.current = {
    selectedIngredientId,
    category,
    quantity,
    unit,
    storeId,
    isValid,
  };

  const buildCurrent = useCallback((): IngredientSnapshot => {
    const s = stateRef.current;
    return {
      name: itemInputValueRef.current,
      category: s.category,
      notes: notesInputValueRef.current,
      quantity: s.quantity,
      unit: s.unit,
      storeId: s.storeId,
    };
  }, [itemInputValueRef, notesInputValueRef]);

  const commit = useCallback(() => {
    const snapshot = snapshotRef.current;
    if (!snapshot) return;
    const state = stateRef.current;
    if (!state.selectedIngredientId) return;
    // Live writes respect the same validity gate the footer button used to
    // enforce: non-empty trimmed name AND truthy quantity AND truthy unit.
    // Intermediate invalid states (e.g. cleared name) simply skip writes
    // until the form is valid again.
    if (!itemInputValueRef.current.trim() || !state.quantity || !state.unit) {
      return;
    }

    const current = buildCurrent();
    const diff = diffIngredientSnapshot({ snapshot, current });
    if (Object.keys(diff).length === 0) return;

    const storeIdChanged = 'storeId' in diff;

    // Writer expects the full current field payload; it reconciles the
    // store link against currentStoreId internally. The diff above is only
    // used to decide *whether* to write and whether to roll the store
    // baseline forward afterwards.
    void updateRecipeIngredient({
      ingredientId: state.selectedIngredientId,
      updates: {
        name: current.name,
        category: current.category,
        notes: current.notes,
        quantity: current.quantity,
        unit: current.unit,
        storeId: current.storeId,
      },
      currentStoreId: currentStoreIdRef.current,
    }).then(() => {
      // Rebase the diff baseline to the just-written values so subsequent
      // edits compare against the committed state. Roll the store baseline
      // forward when the write moved storeId so the next write's link
      // reconcile targets the real current link.
      snapshotRef.current = current;
      if (storeIdChanged) {
        currentStoreIdRef.current = current.storeId;
      }
    });
  }, [buildCurrent, itemInputValueRef]);

  const debouncedCommit = useDebounceCallback(commit, DEBOUNCE_MS);

  // Immediate writes for structured fields. commit is stable (it reads
  // everything via stateRef) so this effect only fires when one of
  // category / quantity / unit / storeId actually changes.
  useEffect(() => {
    if (!snapshotRef.current) return;
    commit();
  }, [category, quantity, unit, storeId, commit]);

  // Debounced writes for free-text fields.
  useEffect(() => {
    if (!snapshotRef.current) return;
    debouncedCommit();
  }, [itemInputValue, notesInputValue, debouncedCommit]);

  const captureSnapshot = useCallback((ingredient: RecipeIngredient) => {
    snapshotRef.current = {
      name: ingredient.name ?? '',
      category: ingredient.category ?? undefined,
      notes: ingredient.notes ?? undefined,
      quantity: ingredient.quantity ?? 1,
      unit: ingredient.unit ?? 'each',
      storeId: ingredient.store?.id,
    };
    currentStoreIdRef.current = ingredient.store?.id;
  }, []);

  const flush = useCallback(() => {
    debouncedCommit.flush();
  }, [debouncedCommit]);

  const clearSnapshot = useCallback(() => {
    snapshotRef.current = null;
    currentStoreIdRef.current = undefined;
    debouncedCommit.cancel();
  }, [debouncedCommit]);

  const onPickMatch = useCallback(
    (match: MatchingItem) => {
      const snapshot = snapshotRef.current;
      if (!snapshot) return;
      const state = stateRef.current;
      if (!state.selectedIngredientId) return;
      if (!itemInputValueRef.current.trim() || !state.quantity || !state.unit) {
        return;
      }

      // Cancel any in-flight text debounce so a stale pre-pick keystroke
      // can't land after the authoritative pick write.
      debouncedCommit.cancel();

      // Quantity isn't carried on autocomplete matches; preserve whatever
      // the user already has in the form so the pick doesn't clobber an
      // in-progress quantity edit. Unit is taken from the match when
      // present (matches today always carry one) and otherwise falls back
      // to the form's current unit.
      const preservedQuantity = state.quantity;
      const nextUnit = match.unit ?? state.unit;

      const nextFields = {
        name: match.name,
        category: match.category,
        notes: match.notes,
        quantity: preservedQuantity,
        unit: nextUnit,
        storeId: match.storeId,
      };

      void updateRecipeIngredient({
        ingredientId: state.selectedIngredientId,
        updates: nextFields,
        currentStoreId: currentStoreIdRef.current,
      });

      // Rebase the diff baseline to the picked target so post-pick edits
      // diff against the committed state, not the initial-present state.
      snapshotRef.current = {
        name: nextFields.name,
        category: nextFields.category,
        notes: nextFields.notes,
        quantity: nextFields.quantity,
        unit: nextFields.unit,
        storeId: nextFields.storeId,
      };
      // Roll the store baseline forward to the picked storeId so the next
      // write's link reconcile targets the real post-pick linked store.
      if (match.storeId !== undefined) {
        currentStoreIdRef.current = match.storeId;
      }
    },
    [debouncedCommit, itemInputValueRef]
  );

  const handle = useMemo<LiveIngredientSyncHandle>(
    () => ({
      captureSnapshot,
      flush,
      clearSnapshot,
      onPickMatch,
    }),
    [captureSnapshot, flush, clearSnapshot, onPickMatch]
  );

  // Keep the caller's ref pointed at the latest handle so
  // AddIngredientProvider (outside the ItemSheetProvider subtree) can call
  // into the hook's imperative surface without prop-drilling.
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
