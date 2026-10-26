import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { scheduleSplashHide } from '../schedule-splash-hide';

describe('splash hide during startup', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('retries after a startup state change cancels the first effect', () => {
    const hasHidden = { current: false };
    const hide = vi.fn();
    const cleanup = scheduleSplashHide(hasHidden, hide);
    vi.advanceTimersByTime(100);
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
