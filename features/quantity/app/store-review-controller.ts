import type { StoreDecisions } from '../store-conflicts';
import { StoreReviewCancelledError } from '../store-review-cancelled';

import type { StoreReviewer, StoreReviewRequest } from './store-review';

/** One presenter per originating sheet session; never steals another flow's review. */
export function createStoreReviewController(enabled = false) {
  let open = enabled;
  let sequence = 0;
  let pending: { id: number; request: StoreReviewRequest } | null = null;
  let settle: {
    resolve: (value: StoreDecisions) => void;
    reject: (error: Error) => void;
  } | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  const finish = (decisions: StoreDecisions | null, requestId?: number) => {
    if (requestId !== undefined && pending?.id !== requestId) return;
    const current = settle;
    settle = null;
    pending = null;
    emit();
    if (decisions) current?.resolve(decisions);
    else current?.reject(new StoreReviewCancelledError());
  };
  const review: StoreReviewer = request =>
    new Promise((resolve, reject) => {
      if (!open) {
        reject(new StoreReviewCancelledError());
        return;
      }
      if (settle) {
        reject(new Error('Finish the current conflict review first.'));
        return;
      }
      settle = { resolve, reject };
      pending = { id: ++sequence, request };
      emit();
    });
  return {
    review,
    finish,
    open: () => {
      open = true;
    },
    close: () => {
      open = false;
      finish(null);
    },
    getSnapshot: () => pending,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
