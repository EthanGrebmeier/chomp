import { beforeEach, describe, expect, it, vi } from 'vitest';

const { insertValuesMock, updateSetMock, selectLimitMock } = vi.hoisted(() => ({
  insertValuesMock: vi.fn(),
  updateSetMock: vi.fn(),
  selectLimitMock: vi.fn(),
}));

vi.mock('../../../../db/local', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: selectLimitMock,
        }),
      }),
    }),
    insert: () => ({
      values: (values: unknown) => {
        insertValuesMock(values)
        const result = Promise.resolve() as Promise<void> & {
          onConflictDoNothing: () => Promise<void>;
        };
        result.onConflictDoNothing = () => Promise.resolve();
        return result;
      },
    }),
    update: () => ({
      set: (values: unknown) => {
        updateSetMock(values);
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      },
    }),
  },
}));

vi.mock('../../../grocery-list/consts/groceries', () => ({
  groceries: [
    { name: 'Apple', category: 'produce' },
    { name: 'Milk', category: 'dairy' },
  ],
}));

import { seedLocalSavedItems } from '../seed-local-items';

describe('seedLocalSavedItems', () => {
  beforeEach(() => {
    insertValuesMock.mockReset();
    updateSetMock.mockReset();
    selectLimitMock.mockReset();
  });

  it('does not rewrite the catalog when saved items have already been seeded', async () => {
    selectLimitMock.mockResolvedValue([{ hasSeededSavedItems: true }]);

    const seededCount = await seedLocalSavedItems();

    expect(seededCount).toBe(0);
    expect(selectLimitMock).toHaveBeenCalledTimes(1);
    expect(insertValuesMock).not.toHaveBeenCalled();
    expect(updateSetMock).not.toHaveBeenCalled();
  });

  it('inserts the default catalog once and marks saved items as seeded', async () => {
    selectLimitMock.mockResolvedValue([{ hasSeededSavedItems: false }]);

    const seededCount = await seedLocalSavedItems();

    expect(seededCount).toBe(2);
    expect(selectLimitMock).toHaveBeenCalledTimes(1);
    expect(insertValuesMock).toHaveBeenCalledTimes(1);
    expect(insertValuesMock.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        id: 'local-0',
        name: 'Apple',
        category: 'produce',
        isDefault: true,
        ownerId: null,
      }),
      expect.objectContaining({
        id: 'local-1',
        name: 'Milk',
        category: 'dairy',
        isDefault: true,
        ownerId: null,
      }),
    ]);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ hasSeededSavedItems: true })
    );
  });

  it('creates app settings before seeding when the settings row is missing', async () => {
    selectLimitMock.mockResolvedValue([]);

    await seedLocalSavedItems();

    expect(insertValuesMock).toHaveBeenCalledTimes(2);
    expect(insertValuesMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        id: 'default',
        hasSeededSavedItems: false,
      })
    );
    expect(insertValuesMock.mock.calls[1][0]).toEqual([
      expect.objectContaining({ id: 'local-0' }),
      expect.objectContaining({ id: 'local-1' }),
    ]);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ hasSeededSavedItems: true })
    );
  });
});
