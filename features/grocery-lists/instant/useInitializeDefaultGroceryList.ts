import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { generateJoinCode } from '../utils/generate-join-code';

const DEFAULT_LIST_NAME = 'Shopping List';
const DEFAULT_LIST_VISIBILITY_RETRY_COUNT = 30;
const DEFAULT_LIST_VISIBILITY_RETRY_DELAY_MS = 200;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const waitForDefaultGroceryList = async (listId: string) => {
  for (
    let attempt = 0;
    attempt < DEFAULT_LIST_VISIBILITY_RETRY_COUNT;
    attempt += 1
  ) {
    const { data } = await db.queryOnce({
      $users: {
        grocery_lists: {},
      },
    });

    const hasList = data?.$users?.[0]?.grocery_lists?.some(
      (groceryList) => groceryList.id === listId
    );

    if (hasList) {
      return;
    }

    await sleep(DEFAULT_LIST_VISIBILITY_RETRY_DELAY_MS);
  }

  throw new Error('Default grocery list did not become available in time');
};

export const initializeDefaultGroceryList = async () => {
  const authUser = await db.getAuth();
  if (!authUser?.id) {
    return null;
  }

  const { data } = await db.queryOnce({
    $users: {
      grocery_lists: {},
    },
  });

  const isGuest = !authUser.email;
  const currentUser = data?.$users?.[0];
  const existingListCount = currentUser?.grocery_lists?.length ?? 0;

  if (
    (!isGuest && currentUser?.hasInitializedGroceryList) ||
    existingListCount > 0
  ) {
    return currentUser?.grocery_lists?.[0]?.id ?? null;
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
  await waitForDefaultGroceryList(listId);
  return listId;
};
