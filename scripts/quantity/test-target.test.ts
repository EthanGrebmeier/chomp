import { describe, expect, it } from 'vitest';
import { assertTestTarget } from './test-target.mjs';

describe('SDK database isolation', () => {
  it.each([
    '5df33e29-252b-4e1c-a111-53787beccba3',
    'b9d047cb-bb6f-4b36-95af-a6a1d045846b',
  ])('rejects production app %s even with matching credentials', appId => {
    expect(() =>
      assertTestTarget({
        INSTANT_TEST_APP_ID: appId,
        EXPO_PUBLIC_INSTANT_APP_ID: appId,
        INSTANT_APP_ADMIN_TOKEN: 'token',
      })
    ).toThrow('forbidden');
  });
  it('requires explicit matching test credentials', () => {
    expect(() => assertTestTarget({})).toThrow();
    expect(() =>
      assertTestTarget({
        INSTANT_TEST_APP_ID: 'test',
        EXPO_PUBLIC_INSTANT_APP_ID: 'other',
        INSTANT_APP_ADMIN_TOKEN: 'token',
      })
    ).toThrow();
    expect(() =>
      assertTestTarget({
        INSTANT_TEST_APP_ID: 'test',
        EXPO_PUBLIC_INSTANT_APP_ID: 'test',
      })
    ).toThrow();
    expect(
      assertTestTarget({
        INSTANT_TEST_APP_ID: 'test',
        EXPO_PUBLIC_INSTANT_APP_ID: 'test',
        INSTANT_APP_ADMIN_TOKEN: 'token',
      })
    ).toBe('test');
  });
});
