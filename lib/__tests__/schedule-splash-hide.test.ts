import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { scheduleSplashHide } from '../schedule-splash-hide';

describe('splash hide during startup', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('retries after a startup state change cancels the first effect', () => {
    const hasHidden = { current: false };
    const hide = vi.fn();
    const cleanup = scheduleSplashHide(hasHidden, hide);

    cleanup?.();
    expect(hasHidden.current).toBe(false);

    scheduleSplashHide(hasHidden, hide);
    vi.advanceTimersByTime(300);
    expect(hide).toHaveBeenCalledOnce();
    expect(hasHidden.current).toBe(true);
  });

  it('does not hide after unmount or while readiness has been revoked', () => {
    const hasHidden = { current: false };
    const hide = vi.fn();
    const cleanup = scheduleSplashHide(hasHidden, hide);
    cleanup?.();
    vi.runAllTimers();
    expect(hide).not.toHaveBeenCalled();
    expect(hasHidden.current).toBe(false);
  });

  it('does not schedule another hide after it has run', () => {
    const hasHidden = { current: false };
    const hide = vi.fn();
    const cleanup = scheduleSplashHide(hasHidden, hide);
    vi.advanceTimersByTime(300);
    cleanup?.();
    expect(scheduleSplashHide(hasHidden, hide)).toBeUndefined();
    vi.runAllTimers();
    expect(hide).toHaveBeenCalledOnce();
  });
});

it('dismisses on the next task when ready, without a fixed startup delay', () => {
  vi.useFakeTimers();
  const hide = vi.fn();
  scheduleSplashHide({ current: false }, hide);
  vi.advanceTimersByTime(0);
  expect(hide).toHaveBeenCalledOnce();
  vi.useRealTimers();
});

it('bounds the wait for data and cancels it when the screen becomes ready', () => {
  vi.useFakeTimers();
  const hidden = { current: false };
  const hide = vi.fn();
  const cancel = scheduleSplashHide(hidden, hide, 5000);
  vi.advanceTimersByTime(1000);
  expect(hide).not.toHaveBeenCalled();
  cancel?.();
  scheduleSplashHide(hidden, hide);
  vi.advanceTimersByTime(0);
  vi.advanceTimersByTime(5000);
  expect(hide).toHaveBeenCalledOnce();
  vi.useRealTimers();
});
