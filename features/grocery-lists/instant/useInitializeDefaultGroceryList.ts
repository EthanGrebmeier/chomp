import { id } from '@instantdb/react-native';
import { useEffect, useRef } from 'react';

import { db } from '../../../lib/instant';
import { generateJoinCode } from '../utils/generate-join-code';

const DEFAULT_LIST_NAME = 'Shopping List';

/**
 * Hook that creates a default grocery list for new users.
 * Safe to call multiple times - initialization only happens once per user.
 */
export const useInitializeDefaultGroceryList = () => {
  const hasAttemptedRef = useRef(false);
  const { user, isLoading } = db.useAuth();

  useEffect(() => {
    if (isLoading || !user || hasAttemptedRef.current) {
      return;
    }

    const initializeDefaultList = async () => {
      hasAttemptedRef.current = true;

      // Check if user has already been initialized
      const { data } = await db.queryOnce({
        $users: {},
      });

      const currentUser = data?.$users?.[0];
      if (currentUser?.hasInitializedGroceryList) {
        return;
      }

      // Create default grocery list
      const listId = id();
      const shareId = id();
      const joinCode = generateJoinCode();
      const now = new Date().toISOString();

      await db.transact([
        db.tx.grocery_lists[listId]
          .create({
            name: DEFAULT_LIST_NAME,
            joinCode,
            ownerId: user.id,
            createdAt: now,
            updatedAt: now,
          })
          .link({
            owner: user.id,
          }),
        db.tx.grocery_list_shares[shareId]
          .create({
            grocery_list_id: listId,
            user_id: user.id,
          })
          .link({
            grocery_list: listId,
          }),
        db.tx.$users[user.id].update({
          hasInitializedGroceryList: true,
        }),
      ]);
    };

    initializeDefaultList().catch(err => {
      console.error('Failed to initialize default grocery list:', err);
      // Reset attempt flag so it can retry on next render
      hasAttemptedRef.current = false;
    });
  }, [user, isLoading]);
};
