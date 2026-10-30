import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';

import { TogglePressable } from '../toggle-pressable';

const runtime = vi.hoisted(() => ({
  taps: [] as { end?: (event: unknown, success: boolean) => void }[],
  queue: [] as (() => void)[],
}));
vi.mock('react', async importOriginal => ({
  ...(await importOriginal<typeof import('react')>()),
  useCallback: (callback: unknown) => callback,
  useMemo: (factory: () => unknown) => factory(),
}));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, View: 'View' }));
vi.mock('expo-haptics', () => ({ selectionAsync: vi.fn() }));
vi.mock('../haptic-pressable', () => ({ HapticPressable: 'Pressable' }));
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    runtime.queue.push(() => callback(...args)),
}));
vi.mock('react-native-gesture-handler', () => ({
  GestureDetector: 'GestureDetector',
  Gesture: {
    Tap: () => {
      const handler = {
        enabled: () => handler,
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
  // The repo's test transformer uses classic JSX for components.
  vi.stubGlobal('React', React);
});
function setup() {
  let checked = false;
  const animatedChecked = {
    get: () => checked,
    set: (next: boolean) => {
      checked = next;
    },
  } as Parameters<typeof TogglePressable>[0]['animatedChecked'];
  const onChange = vi.fn();
  TogglePressable({ checked: false, animatedChecked, onChange });
  return { animatedChecked, onChange, tap: runtime.taps[0] };
}
it('starts feedback while the RN runtime is blocked and preserves rapid reversals', () => {
  const { animatedChecked, onChange, tap } = setup();
  tap.end?.({}, true);
  expect(animatedChecked.get()).toBe(true);
  expect(onChange).not.toHaveBeenCalled();
  tap.end?.({}, true);
  expect(animatedChecked.get()).toBe(false);
  expect(onChange).not.toHaveBeenCalled();
  runtime.queue.forEach(run => run());
  expect(onChange.mock.calls).toEqual([[true], [false]]);
  // Draining earlier saves must not replay their old visual state.
  expect(animatedChecked.get()).toBe(false);
});
it('does not toggle or save when a tap loses to scrolling or a swipe', () => {
  const { animatedChecked, onChange, tap } = setup();
  tap.end?.({}, false);
  expect(animatedChecked.get()).toBe(false);
  expect(runtime.queue).toHaveLength(0);
  expect(onChange).not.toHaveBeenCalled();
});
