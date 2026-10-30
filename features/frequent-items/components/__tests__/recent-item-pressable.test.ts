import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';

import { RecentItemPressable } from '../recent-item-pressable';

const runtime = vi.hoisted(() => ({
  taps: [] as { end?: (event: unknown, success: boolean) => void }[],
  queue: [] as (() => Promise<void>)[],
  styles: [] as (() => { display: string })[],
}));
vi.mock('react', async importOriginal => ({
  ...(await importOriginal<typeof import('react')>()),
  useCallback: (callback: unknown) => callback,
  useMemo: (factory: () => unknown) => factory(),
}));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-haptics', () => ({ selectionAsync: vi.fn() }));
vi.mock('@/components/ui/haptic-pressable', () => ({
  HapticPressable: 'Pressable',
}));
vi.mock('react-native-reanimated', () => ({
  default: { View: 'AnimatedView' },
  useSharedValue: (initial: boolean) => {
    let value = initial;
    return {
      get: () => value,
      set: (next: boolean) => {
        value = next;
      },
    };
  },
  useAnimatedStyle: (factory: () => { display: string }) => {
    runtime.styles.push(factory);
    return factory();
  },
}));
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: () => Promise<void>) => runtime.queue.push(callback),
}));
vi.mock('react-native-gesture-handler', () => ({
  GestureDetector: 'GestureDetector',
  Gesture: {
    Tap: () => {
      const handler = {
        maxDistance: () => handler,
        end: undefined as
          | ((event: unknown, success: boolean) => void)
          | undefined,
        onEnd: (callback: (event: unknown, success: boolean) => void) => {
          handler.end = callback;
          return handler;
        },
      };
      runtime.taps.push(handler);
      return handler;
    },
  },
}));
beforeEach(() => {
  runtime.taps.length = 0;
  runtime.queue.length = 0;
  runtime.styles.length = 0;
  vi.stubGlobal('React', React);
});

it('removes layout space before JS runs and queues only one add per row', async () => {
  const onAdd = vi.fn().mockResolvedValue(undefined);
  RecentItemPressable({ label: 'Add Milk', onAdd, children: null });
  const tap = runtime.taps[0];
  tap.end?.({}, true);
  tap.end?.({}, true);
  expect(runtime.styles[0]()).toEqual({ display: 'none' });
  expect(onAdd).not.toHaveBeenCalled();
  expect(runtime.queue).toHaveLength(1);
  await runtime.queue[0]();
  expect(onAdd).toHaveBeenCalledOnce();
  expect(runtime.styles[0]()).toEqual({ display: 'none' });
});

it('does not collapse or add when scrolling cancels the tap', () => {
  RecentItemPressable({ label: 'Add Milk', onAdd: vi.fn(), children: null });
  runtime.taps[0].end?.({}, false);
  expect(runtime.styles[0]()).toEqual({ display: 'flex' });
  expect(runtime.queue).toHaveLength(0);
});

it('supports accessibility activation with the same duplicate guard', async () => {
  const onAdd = vi.fn().mockResolvedValue(undefined);
  const tree = RecentItemPressable({
    label: 'Add Milk',
    onAdd,
    children: null,
  });
  const view = tree.props.children;
  view.props.onAccessibilityTap();
  view.props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
  expect(onAdd).toHaveBeenCalledOnce();
  expect(runtime.styles[0]()).toEqual({ display: 'none' });
  await Promise.resolve();
});

it('restores failed adds and allows retry without restoring other pending rows', async () => {
  const onAdd = vi
    .fn()
    .mockRejectedValueOnce(new Error('disk full'))
    .mockResolvedValue(undefined);
  RecentItemPressable({ label: 'Add Milk', onAdd, children: null });
  RecentItemPressable({
    label: 'Add Eggs',
    onAdd: vi.fn().mockResolvedValue(undefined),
    children: null,
  });
  runtime.taps.forEach(tap => tap.end?.({}, true));
  await runtime.queue[0]();
  expect(runtime.styles.map(style => style().display)).toEqual([
    'flex',
    'none',
  ]);
  runtime.taps[0].end?.({}, true);
  await runtime.queue[2]();
  expect(onAdd).toHaveBeenCalledTimes(2);
  expect(runtime.styles.map(style => style().display)).toEqual([
    'none',
    'none',
  ]);
});
