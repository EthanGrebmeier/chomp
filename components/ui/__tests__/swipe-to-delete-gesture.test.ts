import { describe, expect, it } from 'vitest';

import {
  getDeleteThreshold,
  shouldDeleteOnRelease,
} from '../swipe-to-delete-gesture';

describe('swipe-to-delete release intent', () => {
  const threshold = getDeleteThreshold(390);

  it('completes a deliberate flick in one swipe', () => {
    expect(shouldDeleteOnRelease(100, -800, threshold)).toBe(true);
  });

  it('only reveals the action for a short flick or slow partial swipe', () => {
    expect(shouldDeleteOnRelease(35, -2000, threshold)).toBe(false);
    expect(shouldDeleteOnRelease(100, -100, threshold)).toBe(false);
  });

  it('commits a slow swipe past the threshold', () => {
    expect(shouldDeleteOnRelease(threshold, 0, threshold)).toBe(true);
  });

  it('allows reversing direction to cancel even past the threshold', () => {
    expect(shouldDeleteOnRelease(threshold + 20, 800, threshold)).toBe(false);
    expect(shouldDeleteOnRelease(100, 800, threshold)).toBe(false);
  });

  it('keeps the distance reachable on large screens', () => {
    expect(getDeleteThreshold(1024)).toBe(180);
    expect(shouldDeleteOnRelease(100, -800, getDeleteThreshold(1024))).toBe(
      true
    );
  });
});
