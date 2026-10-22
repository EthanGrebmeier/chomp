import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
}));
vi.mock('../../../../db/local', () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => ({ limit: mocks.select }) }),
    }),
    update: () => ({
      set: (value: unknown) => {
        mocks.update(value);
        return { where: async () => {} };
      },
    }),
    insert: () => ({ values: mocks.insert }),
  },
}));
vi.mock('../../../../lib/instant', () => ({
  db: { getAuth: async () => ({ id: 'owner' }) },
}));
vi.mock('../../../../lib/utils', () => ({ generateId: () => 'generated' }));

import { upsertLocalSavedItem } from '../upsert-local-saved-item';

it('retries a completed rename without inserting a duplicate recent item', async () => {
  mocks.select
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 'renamed-item' }]);
  await upsertLocalSavedItem({
    item: { name: 'Oat milk', notes: 'Unsweetened' },
    matchName: 'Milk',
  });
  expect(mocks.select).toHaveBeenCalledTimes(2);
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Oat milk',
      notes: 'Unsweetened',
    })
  );
});
