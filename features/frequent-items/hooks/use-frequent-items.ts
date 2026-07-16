import { useEffect, useMemo, useRef, useState } from 'react';

import { db } from '@/lib/instant';

import { buildAddEventTransactions } from '../instant/build-add-event-transactions';
import {
  buildFrequentItems,
  getFrequentItemsCutoff,
  getFrequentItemsQueryCutoff,
} from '../utils/frequent-items';

import {
  setCachedFrequentItems,
  useCachedFrequentItems,
} from './frequent-items-memory-cache';

const BACKFILL_BATCH_SIZE = 100;

export const useFrequentItems = (listId: string) => {
  const { user } = db.useAuth();
  const cacheKey = user ? `${user.id}:${listId}` : null;
  const cachedFrequentItems = useCachedFrequentItems(cacheKey);
  const [{ cutoff, queryCutoff }] = useState(() => {
    const now = new Date();
    return {
      cutoff: getFrequentItemsCutoff(now),
      queryCutoff: getFrequentItemsQueryCutoff(now),
    };
  });
  const [backfillError, setBackfillError] = useState<Error | null>(null);
  const backfillAttemptedForListRef = useRef<string | null>(null);

  const query = db.useQuery({
    grocery_lists: {
      $: {
        where: {
          id: listId,
        },
      },
      grocery_items: {
        store: {},
      },
      grocery_item_add_events: {
        $: {
          where: {
            addedAt: {
              $gte: queryCutoff,
            },
          },
        },
        store: {},
      },
    },
  });

  const list = query.data?.grocery_lists[0];
  const itemsToBackfill = useMemo(() => {
    if (!list) return [];

    const existingEventIds = new Set(
      list.grocery_item_add_events.map(event => event.id)
    );
    return list.grocery_items.filter(
      item => item.createdAt >= cutoff && !existingEventIds.has(item.id)
    );
  }, [cutoff, list]);

  useEffect(() => {
    if (
      !list ||
      itemsToBackfill.length === 0 ||
      backfillAttemptedForListRef.current === listId
    ) {
      return;
    }

    backfillAttemptedForListRef.current = listId;

    let isCancelled = false;

    const backfill = async () => {
      try {
        for (
          let index = 0;
          index < itemsToBackfill.length;
          index += BACKFILL_BATCH_SIZE
        ) {
          const batch = itemsToBackfill.slice(
            index,
            index + BACKFILL_BATCH_SIZE
          );
          const transactions = batch.flatMap(item =>
            buildAddEventTransactions({
              eventId: item.id,
              listId,
              item: {
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                category: item.category ?? undefined,
                notes: item.notes ?? undefined,
                storeId: item.store?.id,
              },
              addedAt: item.createdAt,
            })
          );
          await db.transact(transactions);
        }
      } catch (error) {
        if (!isCancelled) {
          setBackfillError(
            error instanceof Error
              ? error
              : new Error('Unable to prepare item history')
          );
        }
      }
    };

    void backfill();

    return () => {
      isCancelled = true;
    };
  }, [itemsToBackfill, list, listId]);

  const freshFrequentItems = useMemo(() => {
    if (!list) return undefined;

    return buildFrequentItems({
      events: list.grocery_item_add_events,
      currentItems: list.grocery_items,
    });
  }, [list]);
  const isBackfilling = itemsToBackfill.length > 0 && !backfillError;

  useEffect(() => {
    if (!cacheKey || !freshFrequentItems || isBackfilling) {
      return;
    }

    setCachedFrequentItems(cacheKey, freshFrequentItems);
  }, [cacheKey, freshFrequentItems, isBackfilling]);

  const frequentItems =
    freshFrequentItems && !isBackfilling
      ? freshFrequentItems
      : (cachedFrequentItems ?? freshFrequentItems ?? []);
  const hasCachedResult = cachedFrequentItems !== undefined;

  return {
    frequentItems,
    isLoading: !hasCachedResult && (query.isLoading || isBackfilling),
    error: hasCachedResult ? undefined : (query.error ?? backfillError),
  };
};
