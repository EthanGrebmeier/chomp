import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  MutationObserver,
  QueryClient,
  onlineManager,
  type MutationObserverOptions,
} from '@tanstack/react-query';

const capture = vi.hoisted(() => ({
  options: [] as MutationObserverOptions<unknown, Error, unknown>[],
  write: vi.fn(),
}));
vi.mock('@tanstack/react-query', async importOriginal => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useMutation: (options: MutationObserverOptions<unknown, Error, unknown>) => {
    capture.options.push(options);
    return {};
  },
  useQueryClient: () => ({ setQueryData: vi.fn() }),
}));
vi.mock('@/features/stores/instant/use-default-store', () => ({
  useDefaultStore: () => ({ data: null }),
}));
vi.mock('@/features/meal-planner/instant/add-item-to-meal-plan', () => ({
  addItemToDate: capture.write,
}));
vi.mock('@/features/grocery-list/instant/delete-grocery-items', () => ({
  deleteGroceryItems: capture.write,
}));
vi.mock('@/features/grocery-list/db/update-settings', () => ({
  updateSettings: capture.write,
}));
vi.mock('@/features/recipes/instant/create-recipe', () => ({
  createRecipe: capture.write,
}));
vi.mock('sonner-native', () => ({ toast: { success: vi.fn() } }));

import { useAddItemToDate } from '@/features/meal-planner/hooks/useAddItemToMealPlan';
import { useClearGroceryList } from '@/features/grocery-list/instant/clear-list';
import { useUpdateSettings } from '@/features/grocery-list/hooks/useUpdateSettings';
import { useCreateRecipe } from '@/features/recipes/hooks/useCreateRecipe';

beforeEach(() => {
  capture.options = [];
  capture.write.mockReset().mockResolvedValue({ id: 'saved' });
  onlineManager.setOnline(false);
});
afterEach(() => onlineManager.setOnline(true));

it.each([
  ['add a meal', useAddItemToDate, { listId: 'downloaded', name: 'Lunch' }],
  ['clear groceries', useClearGroceryList, { items: [] }],
  ['save settings', useUpdateSettings, { sortBy: 'name' }],
  [
    'create a recipe',
    useCreateRecipe,
    { recipe: { name: 'Soup' }, ingredients: [] },
  ],
] as const)('runs the local writer offline: %s', async (_label, hook, args) => {
  hook();
  const client = new QueryClient();
  const observer = new MutationObserver(client, capture.options[0]);
  const result = observer.mutate(args);
  await vi.waitFor(() => expect(capture.write).toHaveBeenCalledOnce());
  expect(observer.getCurrentResult().isPaused).toBe(false);
  await result;
  expect(observer.getCurrentResult().isSuccess).toBe(true);
  client.clear();
});
