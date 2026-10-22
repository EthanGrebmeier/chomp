import { id } from '@instantdb/react-native';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import { toast } from 'sonner-native';

import { db } from '@/lib/instant';

import { saveRecipe } from '../meals';
import { records } from '../model';
import { useQuantityWorkspace } from '../use-quantity-workspace';

import { recipeFromApp, ensureQuantityList } from './initialize';
import { syncQuantitySavedItems } from './saved-items';
import { publishListSession, emptyListSession } from './session';
import { StoreReviewHost } from './store-review-sheet';

function Session({ listId, userId }: { listId: string; userId: string }) {
  const session = useQuantityWorkspace(listId, userId, syncQuantitySavedItems);
  const sources = db.useQuery({
    recipes: { recipe_ingredients: { store: {} } },
  });
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
    publishListSession(listId, session);
  }, [listId, session]);
  useEffect(() => () => publishListSession(listId, null), [listId]);
  return null;
}
function Initialize({ listId, userId }: { listId: string; userId: string }) {
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const connection = db.useConnectionStatus();
  useEffect(() => {
    if (connection !== 'authenticated') return;
    let active = true;
    ensureQuantityList(listId, userId)
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
  }, [connection, listId, userId, attempt]);
  useEffect(() => () => publishListSession(listId, null), [listId]);
  return ready ? <Session listId={listId} userId={userId} /> : null;
}
export function QuantityAppProvider({ children }: { children: ReactNode }) {
  const { user } = db.useAuth();
  const query = db.useQuery(user ? { grocery_lists: {} } : null);
  return (
    <>
      {user
        ? query.data?.grocery_lists.map(list => (
            <Initialize
              key={`${user.id}:${list.id}`}
              listId={list.id}
              userId={user.id}
            />
          ))
        : null}
      {children}
      {user ? <StoreReviewHost key={user.id} /> : null}
    </>
  );
}
