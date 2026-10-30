/** User dismissal aborts the pending addition without reporting a failure. */
export class StoreReviewCancelledError extends Error {
  constructor() {
    super('Addition cancelled');
    this.name = 'StoreReviewCancelledError';
  }
}

export const isStoreReviewCancelled = (error: unknown): boolean =>
  error instanceof StoreReviewCancelledError;
