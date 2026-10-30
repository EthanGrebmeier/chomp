import { describe, expect, it } from 'vitest';

import { createStoreReviewController } from '../app/store-review-controller';
import { StoreReviewCancelledError } from '../store-review-cancelled';

const request = { conflicts: [], stores: {}, changed: false };

describe('originating-sheet conflict review', () => {
  it('returns the selected destinations and removes the card', async () => {
    const controller = createStoreReviewController();
    controller.open();
    const result = controller.review(request);
    const pending = controller.getSnapshot()!;
    expect(pending.request).toBe(request);
    controller.finish(
      { ingredient: { rowId: 'row', store: 'store' } },
      pending.id
    );
    await expect(result).resolves.toEqual({
      ingredient: { rowId: 'row', store: 'store' },
    });
    expect(controller.getSnapshot()).toBeNull();
  });

  it('backs out silently and allows a new attempt in the same sheet', async () => {
    const controller = createStoreReviewController();
    controller.open();
    const first = controller.review(request);
    const rejection = expect(first).rejects.toBeInstanceOf(
      StoreReviewCancelledError
    );
    controller.finish(null);
    await rejection;
    const second = controller.review(request);
    controller.finish({});
    await expect(second).resolves.toEqual({});
  });

  it('dismissal rejects both the pending review and late requests from the closed session', async () => {
    const controller = createStoreReviewController();
    controller.open();
    const pending = controller.review(request);
    const rejection = expect(pending).rejects.toBeInstanceOf(
      StoreReviewCancelledError
    );
    controller.close();
    await rejection;
    await expect(controller.review(request)).rejects.toBeInstanceOf(
      StoreReviewCancelledError
    );
    expect(controller.getSnapshot()).toBeNull();
  });

  it('does not let an exiting card settle a newer review', async () => {
    const controller = createStoreReviewController();
    controller.open();
    const first = controller.review(request);
    const firstId = controller.getSnapshot()!.id;
    controller.finish({}, firstId);
    await first;
    const second = controller.review({ ...request, changed: true });
    const secondId = controller.getSnapshot()!.id;
    controller.finish(null, firstId);
    expect(controller.getSnapshot()?.id).toBe(secondId);
    controller.finish({}, secondId);
    await expect(second).resolves.toEqual({});
  });

  it('keeps concurrent sheets isolated and rejects overlapping requests within one sheet', async () => {
    const first = createStoreReviewController();
    const second = createStoreReviewController();
    first.open();
    second.open();
    const a = first.review(request);
    const b = second.review(request);
    await expect(first.review(request)).rejects.toThrow(
      'Finish the current conflict review first.'
    );
    first.finish({ first: {} });
    expect(second.getSnapshot()).not.toBeNull();
    second.finish({ second: {} });
    await expect(a).resolves.toEqual({ first: {} });
    await expect(b).resolves.toEqual({ second: {} });
  });
});
