import { expect, it, vi } from 'vitest';
import { useGroceryLists } from '../useGroceryLists';
const mocks = vi.hoisted(() => ({
  access: {
    isHydrated: false,
    hasLocalValue: false,
    accessTimes: {} as Record<string, string>,
  },
}));
vi.mock('react', () => ({
  useEffect: () => {},
  useMemo: (read: () => unknown) => read(),
}));
vi.mock('@/lib/instant', () => ({
  db: {
    useAuth: () => ({ user: { id: 'guest' } }),
    useQuery: () => ({
      isLoading: false,
      data: { grocery_lists: [{ id: 'first' }, { id: 'last' }] },
    }),
  },
}));
vi.mock('../../local/list-access-store', () => ({
  useListAccessTimes: () => mocks.access,
  seedListAccessTimes: vi.fn(),
}));
it('does not expose a fallback list until device-local history is ready', () => {
  expect(useGroceryLists()).toMatchObject({ isLoading: true, data: undefined });
  mocks.access.isHydrated = true;
  expect(useGroceryLists()).toMatchObject({ isLoading: true, data: undefined });
  mocks.access.hasLocalValue = true;
  mocks.access.accessTimes = { last: '2026-10-25T12:00:00Z' };
  const result = useGroceryLists();
  expect(result.isLoading).toBe(false);
  expect(result.data?.grocery_lists[0].id).toBe('last');
});
