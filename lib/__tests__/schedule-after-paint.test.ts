import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { scheduleAfterPaint } from '../schedule-after-paint';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) =>
    setTimeout(callback, 16)
  );
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('allows a paint between native hide dispatch and background rendering', () => {
  const preload = vi.fn();
  scheduleAfterPaint(preload);
  vi.advanceTimersByTime(16);
  expect(preload).not.toHaveBeenCalled();
  vi.advanceTimersByTime(16);
  expect(preload).toHaveBeenCalledOnce();
});

it.each([0, 16])('cancels on unmount after %i milliseconds', elapsed => {
  const preload = vi.fn();
  const cancel = scheduleAfterPaint(preload);
  vi.advanceTimersByTime(elapsed);
  cancel();
  vi.runAllTimers();
  expect(preload).not.toHaveBeenCalled();
});
