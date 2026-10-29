import { id } from '@instantdb/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobalSearchParams, useSegments } from 'expo-router';
import {
  memo,
  startTransition,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { toast } from 'sonner-native';

import { useCategoryOptions } from '@/features/categories/use-category-options';
import { useSettings } from '@/features/grocery-list/hooks/useSettings';
import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { useListAccessTimes } from '@/features/grocery-lists/local/list-access-store';
import { db } from '@/lib/instant';
import { useAppEntryVisible } from '@/lib/startup-screen-ready';

import { quantityWorkspaceAvailable } from '../config';
import { saveRecipe } from '../meals';
import { records } from '../model';
import { useQuantityWorkspace } from '../use-quantity-workspace';

import { entryListId, retainEntryLists } from './entry-lists';
import { initializationCache } from './initialization-cache';
import { recipeFromApp, ensureQuantityList } from './initialize';
import { syncQuantitySavedItems } from './saved-items';
import {
  publishListSession,
  emptyListSession,
  useQuantityList,
} from './session';
import { StoreReviewHost } from './store-review-sheet';

const initializedLists = initializationCache(AsyncStorage);

function Session({
  listId,
  userId,
  initialized,
}: {
  listId: string;
  userId: string;
  initialized: boolean;
}) {
  const session = useQuantityWorkspace(
    listId,
    userId,
    syncQuantitySavedItems,
    initialized
  );
  const entryVisible = useAppEntryVisible();
  const sources = db.useQuery(
    entryVisible && session.canEdit
      ? {
          recipes: { recipe_ingredients: { store: {} } },
        }
      : null
  );
  const sourceWrite = useRef(false);
  useEffect(() => {
    if (
      !session.canEdit ||
      session.pending.length ||
      session.state.conflicts.length ||
      sourceWrite.current
    )
      return;
    for (const source of sources.data?.recipes ?? []) {
      const existing = records(session.state, 'recipe').find(
        r => r.id === source.id
      );
      if (!existing || existing.deleted) continue;
      const recipe = recipeFromApp(source);
      const { version: _version, ...document } = existing;
      if (JSON.stringify(document) === JSON.stringify(recipe)) continue;
      sourceWrite.current = true;
      void session
        .send(saveRecipe(session.state, id, recipe))
        .catch(error =>
          toast.error(
            error instanceof Error
              ? error.message
              : 'Could not update planned recipe quantities'
          )
        )
        .finally(() => {
          sourceWrite.current = false;
        });
      break;
    }
  }, [session, sources.data]);
  useEffect(() => {
    if (initialized) publishListSession(listId, session);
  }, [initialized, listId, session]);
  useEffect(() => () => publishListSession(listId, null), [listId]);
  return null;
}
const Initialize = memo(function Initialize({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}) {
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const connection = db.useConnectionStatus();
  useEffect(() => {
    let active = true;
    void initializedLists.has(listId, userId).then(cached => {
      if (active && cached) setReady(true);
    });
    return () => {
      active = false;
    };
  }, [listId, userId]);
  useEffect(() => {
    if (ready || connection !== 'authenticated') return;
    let active = true;
    initializedLists
      .has(listId, userId)
      .then(async cached => {
        if (cached) return;
        await ensureQuantityList(listId, userId);
        await initializedLists.mark(listId, userId);
      })
      .then(() => {
        if (active) setReady(true);
      })
      .catch(error => {
        if (active)
          publishListSession(listId, {
            ...emptyListSession,
            loading: false,
            error: String(error),
            retry: async () => {
              setAttempt(value => value + 1);
            },
          });
      });
    return () => {
      active = false;
    };
  }, [connection, listId, userId, attempt, ready]);
  useEffect(() => () => publishListSession(listId, null), [listId]);
  return <Session listId={listId} userId={userId} initialized={ready} />;
});
/** Load the visible list first; keep cross-list sessions warm once entry has painted. */
function QuantitySessions({ userId }: { userId: string }) {
  const query = useGroceryLists();
  const access = useListAccessTimes(userId);
  useCategoryOptions();
  db.useQuery({ stores: {} });
  const { listId } = useGlobalSearchParams<{ listId?: string }>();
  const segments = useSegments();
  const lists = query.data?.grocery_lists ?? [];
  const priorityListId = entryListId(
    lists,
    query.isLoading,
    listId,
    access.accessTimes
  );
  const priority = useQuantityList(priorityListId);
  const entryVisible = useAppEntryVisible();
  const [startedIds, setStartedIds] = useState<readonly string[]>([]);
  const retainedIds = retainEntryLists(
    startedIds,
    priorityListId,
    lists,
    query.isLoading
  );
  if (retainedIds !== startedIds) setStartedIds(retainedIds);
  const nextBackgroundId = lists.find(
    list => !retainedIds.includes(list.id)
  )?.id;
  const warming = useQuantityList(retainedIds.at(-1));
  const canWarmNext = warming.canEdit || Boolean(warming.error);
  const onAppRoute = Boolean(segments[0] && segments[0] !== '(auth)');
  useEffect(() => {
    if (
      !nextBackgroundId ||
      !canWarmNext ||
      !entryVisible ||
      !onAppRoute ||
      (!priority.canEdit && !priority.error)
    )
      return;
    const idle = requestIdleCallback(() =>
      startTransition(() =>
        setStartedIds(ids =>
          ids.includes(nextBackgroundId) ? ids : [...ids, nextBackgroundId]
        )
      )
    );
    return () => cancelIdleCallback(idle);
  }, [
    entryVisible,
    nextBackgroundId,
    canWarmNext,
    onAppRoute,
    priority.canEdit,
    priority.error,
  ]);
  return retainedIds.map(id => (
    <Initialize key={id} listId={id} userId={userId} />
  ));
}

export function QuantityAppProvider({ children }: { children: ReactNode }) {
  const { user } = db.useAuth();
  const enabled = quantityWorkspaceAvailable();
  useSettings();
  return (
    <>
      {enabled && user ? (
        <QuantitySessions key={`sessions:${user.id}`} userId={user.id} />
      ) : null}
      {children}
      {enabled && user ? <StoreReviewHost key={user.id} /> : null}
    </>
  );
}
