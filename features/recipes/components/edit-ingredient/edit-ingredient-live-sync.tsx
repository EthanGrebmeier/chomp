import { RefObject } from 'react';

import {
  LiveIngredientSyncHandle,
  useLiveIngredientSync,
} from './use-live-ingredient-sync';

export type { LiveIngredientSyncHandle };

type EditIngredientLiveSyncProps = {
  selectedIngredientId: string | null;
  currentStoreId: string | undefined;
  liveSyncRef: RefObject<LiveIngredientSyncHandle | null>;
};

/**
 * Thin null-rendering consumer that runs useLiveIngredientSync inside the
 * ItemSheetProvider subtree (where shared form state is readable) and
 * publishes its imperative handle via the liveSyncRef it receives from
 * AddIngredientProvider. Mirrors EditItemLiveSync in the grocery edit
 * sheet but takes liveSyncRef as a direct prop rather than through a
 * sheet-scoped internal context, because AddIngredientProvider is a
 * unified add/edit provider and doesn't need a separate internal context.
 */
export const EditIngredientLiveSync = ({
  selectedIngredientId,
  currentStoreId,
  liveSyncRef,
}: EditIngredientLiveSyncProps) => {
  useLiveIngredientSync({
    selectedIngredientId,
    currentStoreId,
    handleRef: liveSyncRef,
  });
  return null;
};
