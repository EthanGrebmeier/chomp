import { describe, expect, it } from 'vitest';

import { hasReachedStartupRoute } from '../startup-route';

describe('startup route readiness', () => {
  it.each(['(tabs)', 'shopping', 'recipes', 'settings', 'meal-plan'])(
    'allows signed-in startup to finish on %s',
    segment => {
      expect(hasReachedStartupRoute(segment, true)).toBe(true);
    }
  );

  it('does not trap the splash when shopping restoration replaces the tabs', () => {
    expect(hasReachedStartupRoute('(tabs)', true)).toBe(true);
    expect(hasReachedStartupRoute('shopping', true)).toBe(true);
  });

  it('waits for the root redirect and the correct auth destination', () => {
    expect(hasReachedStartupRoute(undefined, true)).toBe(false);
    expect(hasReachedStartupRoute(undefined, false)).toBe(false);
    expect(hasReachedStartupRoute('(auth)', true)).toBe(false);
    expect(hasReachedStartupRoute('(auth)', false)).toBe(true);
    expect(hasReachedStartupRoute('(tabs)', false)).toBe(false);
    expect(hasReachedStartupRoute('shopping', false)).toBe(false);
  });
});
