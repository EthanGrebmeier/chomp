import { id } from '@instantdb/react-native';
import { useEffect, useRef } from 'react';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { generateJoinCode } from '../utils/generate-join-code';

const DEFAULT_LIST_NAME = 'Shopping List';

type InitializeDefaultListOptions = {
  enabled?: boolean;
  initKey?: number;
};

/**
 * Hook that creates a default grocery list for new users.
 * Safe to call multiple times - initialization only happens once per auth id.
 */
export const useInitializeDefaultGroceryList = (
  options: InitializeDefaultListOptions = {}
) => {
  const { enabled = true, initKey } = options;
  const initStateRef = useRef({
    inFlight: false,
    lastAuthId: null as string | null,
    lastInitKey: null as number | null,
  });
  const { user, isLoading } = db.useAuth();

  useEffect(() => {
    if (
      !enabled ||
      isLoading ||
      !user ||
      initStateRef.current.inFlight ||
      (initKey !== undefined && initKey === initStateRef.current.lastInitKey)
    ) {
      return;
    }

    const initializeDefaultList = async () => {
      initStateRef.current.inFlight = true;

      try {
        const authUser = await db.getAuth();
        if (!authUser?.id) {
          return;
        }

        if (initStateRef.current.lastAuthId === authUser.id) {
          return;
        }

        const isGuest = !authUser.email;
        let currentUser:
          | { hasInitializedGroceryList?: boolean; grocery_lists?: unknown[] }
          | undefined;
        let existingListCount = 0;

        try {
          const { data } = await db.queryOnce({
            $users: {
              grocery_lists: {},
            },
          });

          currentUser = data?.$users?.[0];
          existingListCount = currentUser?.grocery_lists?.length ?? 0;
        } catch {
          // If the check fails, proceed with creation to avoid missing lists
        }

        if (
          (!isGuest && currentUser?.hasInitializedGroceryList) ||
          existingListCount > 0
        ) {
          initStateRef.current.lastAuthId = authUser.id;
          initStateRef.current.lastInitKey = initKey ?? null;
          return;
        }

        const listId = id();
        const shareId = id();
        const joinCode = generateJoinCode();
        const now = new Date().toISOString();

        const transactions: Parameters<typeof db.transact>[0] = [
          db.tx.grocery_lists[listId]
            .create(
              trimStringFields({
                name: DEFAULT_LIST_NAME,
                joinCode,
                ownerId: authUser.id,
                createdAt: now,
                updatedAt: now,
              })
            )
            .link({
              owner: authUser.id,
            }),
          db.tx.grocery_list_shares[shareId]
            .create(
              trimStringFields({
                grocery_list_id: listId,
                user_id: authUser.id,
                lastAccessedAt: now,
              })
            )
            .link({
              grocery_list: listId,
            }),
        ];

        if (!isGuest) {
          transactions.push(
            db.tx.$users[authUser.id].update(
              trimStringFields({
                hasInitializedGroceryList: true,
              })
            )
          );
        }

        await db.transact(transactions);
        initStateRef.current.lastAuthId = authUser.id;
        initStateRef.current.lastInitKey = initKey ?? null;
      } finally {
        initStateRef.current.inFlight = false;
      }
    };

    initializeDefaultList().catch(() => {
      initStateRef.current.inFlight = false;
    });
  }, [enabled, isLoading, user, initKey]);
};
