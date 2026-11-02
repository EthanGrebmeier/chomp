import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  connection: 'authenticated',
  transact: vi.fn(),
  queryOnce: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@instantdb/react-native', async () => {
  const { id } = await import('@instantdb/core');
  return { id };
});
vi.mock('@/lib/instant', async () => {
  const { tx } = await import('@instantdb/core');
  return {
    db: {
      tx,
      useConnectionStatus: () => state.connection,
      getAuth: async () => ({ id: 'user' }),
      transact: state.transact,
      queryOnce: state.queryOnce,
    },
  };
});
vi.mock('react-native', () => ({ Alert: { alert: vi.fn() } }));
vi.mock('sonner-native', () => ({
  toast: { success: state.success, error: state.error },
}));

import { useCreateGroceryList } from '../useCreateGroceryList';
import { useDeleteGroceryList } from '../useDeleteGroceryList';

beforeEach(() => {
  vi.clearAllMocks();
  state.connection = 'authenticated';
  state.transact.mockResolvedValue({ status: 'synced' });
  state.queryOnce.mockResolvedValue({
    data: {
      grocery_lists: [
        { id: 'first', ownerId: 'user' },
        { id: 'second', ownerId: 'user' },
      ],
    },
  });
});

it('fails new-list creation clearly offline before writing an unusable list', async () => {
  state.connection = 'closed';
  await expect(useCreateGroceryList()('New list')).rejects.toThrow('Connect');
  expect(state.transact).not.toHaveBeenCalled();
});

it('does not report list creation as confirmed when connection drops during save', async () => {
  state.transact.mockResolvedValue({ status: 'enqueued' });
  await expect(useCreateGroceryList()('New list')).rejects.toThrow(
    'Waiting for a connection'
  );
});

it('does not navigate away or report success after a failed list delete', async () => {
  state.queryOnce.mockRejectedValue(new Error('Offline'));
  expect(await useDeleteGroceryList()('first')).toBe(false);
  expect(state.success).not.toHaveBeenCalled();
  expect(state.error).toHaveBeenCalledOnce();
});

it('requires server acknowledgement before confirming list deletion', async () => {
  state.transact.mockResolvedValue({ status: 'enqueued' });
  expect(await useDeleteGroceryList()('first')).toBe(false);
  expect(state.success).not.toHaveBeenCalled();
  state.transact.mockResolvedValue({ status: 'synced' });
  expect(await useDeleteGroceryList()('first')).toBe(true);
  expect(state.success).toHaveBeenCalledWith('List deleted');
});
