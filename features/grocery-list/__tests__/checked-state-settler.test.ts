import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  createCheckedStateSettler,
  createCheckedStateSnapshot,
} from '../checked-state-presentation';
import {
  applyPendingCheckedState,
  beginPendingCheckedState,
  endPendingCheckedState,
  getPendingCheckedState,
  resetPendingCheckedStateForTests,
} from '../pending-checked-state';

beforeEach(() => {
  vi.useFakeTimers();
  resetPendingCheckedStateForTests();
});
afterEach(() => {
  vi.useRealTimers();
  resetPendingCheckedStateForTests();
});

it('moves a batch one second after its last tap even when serialized saves publish later', () => {
  let saved = [
    { id: 'a', isChecked: false },
    { id: 'b', isChecked: false },
  ];
  const settle = vi.fn();
  const controller = createCheckedStateSettler(
    createCheckedStateSnapshot(saved),
    settle
  );
  const observe = () =>
    controller.observe(
      createCheckedStateSnapshot(
        applyPendingCheckedState(saved, getPendingCheckedState())
      )
    );
  const a = beginPendingCheckedState('a', true);
  observe();
  vi.advanceTimersByTime(300);
  const b = beginPendingCheckedState('b', true);
  observe();
  vi.advanceTimersByTime(500);
  saved = [
    { id: 'a', isChecked: true },
    { id: 'b', isChecked: false },
  ];
  endPendingCheckedState('a', a);
  observe();
  vi.advanceTimersByTime(499);
  expect(settle).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(settle).toHaveBeenCalledExactlyOnceWith(
    new Map([
      ['a', true],
      ['b', true],
    ])
  );
  vi.advanceTimersByTime(2000);
  saved = saved.map(item => ({ ...item, isChecked: true }));
  endPendingCheckedState('b', b);
  observe();
  vi.advanceTimersByTime(1500);
  expect(settle).toHaveBeenCalledTimes(1);
  controller.dispose();
});

it('restarts for an uncheck and preserves that intent through an older check publication', () => {
  let saved = [{ id: 'a', isChecked: false }];
  const settle = vi.fn();
  const controller = createCheckedStateSettler(
    createCheckedStateSnapshot(saved),
    settle
  );
  const observe = () =>
    controller.observe(
      createCheckedStateSnapshot(
        applyPendingCheckedState(saved, getPendingCheckedState())
      )
    );
  const check = beginPendingCheckedState('a', true);
  observe();
  vi.advanceTimersByTime(700);
  const uncheck = beginPendingCheckedState('a', false);
  observe();
  saved = [{ id: 'a', isChecked: true }];
  endPendingCheckedState('a', check);
  observe();
  vi.advanceTimersByTime(999);
  expect(settle).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(settle).toHaveBeenCalledExactlyOnceWith(new Map([['a', false]]));
  saved = [{ id: 'a', isChecked: false }];
  endPendingCheckedState('a', uncheck);
  observe();
  vi.advanceTimersByTime(1000);
  expect(settle).toHaveBeenCalledTimes(1);
  controller.dispose();
});

it('reconciles a rejected save and cancels movement on unmount', () => {
  const settle = vi.fn();
  const unchecked = new Map([['a', false]]);
  const controller = createCheckedStateSettler(unchecked, settle);
  controller.observe(new Map([['a', true]]));
  vi.advanceTimersByTime(1000);
  controller.observe(unchecked);
  vi.advanceTimersByTime(1000);
  expect(settle.mock.calls).toEqual([[new Map([['a', true]])], [unchecked]]);
  controller.observe(new Map([['a', true]]));
  controller.dispose();
  vi.advanceTimersByTime(1000);
  expect(settle).toHaveBeenCalledTimes(2);
});
