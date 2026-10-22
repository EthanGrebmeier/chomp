import {
  beginPendingCheckedState,
  endPendingCheckedState,
  isPendingCheckedStateCurrent,
} from '../pending-checked-state';

import { updateGroceryItemsCheckedState } from './update-grocery-item-only';

type CheckListItemArgs = {
  itemId: string;
  isChecked: boolean;
};

/**
 * Message the InstantDB client uses when it gives up on an un-acked mutation
 * (`Reactor._sendMutation`). This is the only failure worth retrying: the
 * device reports itself online but the socket never delivered a `transact-ok`,
 * so the SDK dropped the optimistic update. Server-side rejections arrive as
 * `InstantAPIError` and are not retried.
 */
const TRANSACTION_TIMEOUT_MESSAGE = 'transaction timed out';

/** Total attempts, including the first. Each timed-out attempt costs ~6s. */
export const CHECK_LIST_ITEM_MAX_ATTEMPTS = 5;
export const CHECK_LIST_ITEM_RETRY_DELAY_MS = 250;

export const isTransactionTimeoutError = (error: unknown): boolean =>
  error instanceof Error && error.message === TRANSACTION_TIMEOUT_MESSAGE;

const wait = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

/**
 * Writes a single item's checked state, holding the user's intent locally and
 * retrying when the InstantDB client times the mutation out.
 *
 * Resolves once the write is acked (or enqueued for offline flush). Resolves
 * without writing if a newer toggle for the same item supersedes this one.
 * Rejects on non-timeout errors, or once the retry budget is exhausted, so the
 * caller can tell the user.
 */
export const checkListItem = async ({
  itemId,
  isChecked,
}: CheckListItemArgs): Promise<void> => {
  const token = beginPendingCheckedState(itemId, isChecked);

  try {
    for (let attempt = 1; ; attempt += 1) {
      try {
        await updateGroceryItemsCheckedState([{ itemId, isChecked }]);
        return;
      } catch (error) {
        if (
          !isTransactionTimeoutError(error) ||
          attempt >= CHECK_LIST_ITEM_MAX_ATTEMPTS
        ) {
          throw error;
        }
      }

      if (!isPendingCheckedStateCurrent(itemId, token)) {
        return;
      }

      await wait(CHECK_LIST_ITEM_RETRY_DELAY_MS);

      if (!isPendingCheckedStateCurrent(itemId, token)) {
        return;
      }
    }
  } finally {
    endPendingCheckedState(itemId, token);
  }
};
