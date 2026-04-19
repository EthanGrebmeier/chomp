import { useMemo } from 'react';

import { db } from '../../../lib/instant';
import { useLocalSavedItems } from '../local/use-local-saved-items';
import { UnifiedSavedItem } from '../types';

/**
 * Hook that combines local SQLite saved items with cloud InstantDB saved items.
 * Returns a unified array with source indicators for each item.
 */
export const useUnifiedSavedItems = () => {
  const { user } = db.useAuth();

  // Fetch local items from SQLite
  const {
    data: localItems,
    isLoading: isLoadingLocal,
    error: localError,
  } = useLocalSavedItems();

  // Fetch cloud items from InstantDB
  const cloudResult = db.useQuery(
    user
      ? {
          saved_items: {
            $: {
              where: {
                'user.id': user.id,
              },
            },
            store: {},
            user: {},
          },
        }
      : null
  );

  const cloudItems = cloudResult.data?.saved_items ?? [];
  const isLoadingCloud = cloudResult.isLoading;
  const cloudError = cloudResult.error;

  // Merge local and cloud items
  const unifiedItems = useMemo((): UnifiedSavedItem[] => {
    const localUnified: UnifiedSavedItem[] = localItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category ?? undefined,
      notes: item.notes ?? undefined,
      storeId: item.storeId ?? undefined,
      source: 'local' as const,
    }));

    const cloudUnified: UnifiedSavedItem[] = cloudItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category ?? undefined,
      notes: item.notes ?? undefined,
      storeId: item.store?.id,
      store: item.store ? { id: item.store.id, name: item.store.name } : undefined,
      source: 'cloud' as const,
      ownerId: item.user?.id,
    }));

    // Combine both arrays
    return [...localUnified, ...cloudUnified];
  }, [localItems, cloudItems]);

  return {
    data: unifiedItems,
    isLoading: isLoadingLocal || isLoadingCloud,
    error: localError || cloudError,
  };
};

