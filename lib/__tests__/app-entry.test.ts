import { expect, it } from 'vitest';

import { reconcileAppEntry, reportAppEntryReady } from '../app-entry';

it('keeps an authenticated screen covered until its rendered data is ready', () => {
  const pending = {
    userId: 'one',
    ready: false,
    revealed: false,
    painted: false,
  };
  expect(reconcileAppEntry(pending, 'one', true)).toBe(pending);
  const ready = reportAppEntryReady(pending, 'one', true);
  expect(reconcileAppEntry(ready, 'one', false).revealed).toBe(false);
  const visible = reconcileAppEntry(ready, 'one', true);
  expect(visible.revealed).toBe(true);
  // Realtime updates/list switching do not re-cover a session already in use.
  expect(
    reconcileAppEntry(reportAppEntryReady(visible, 'one', false), 'one', true)
      .revealed
  ).toBe(true);
});

it('resets after sign-out and ignores stale readiness callbacks across accounts', () => {
  const visible = { userId: 'one', ready: true, revealed: true, painted: true };
  const signedOut = reconcileAppEntry(visible, undefined, false);
  expect(signedOut).toEqual({
    userId: undefined,
    ready: false,
    revealed: false,
    painted: false,
  });
  const next = reconcileAppEntry(signedOut, 'two', true);
  expect(reportAppEntryReady(next, 'one', true)).toBe(next);
  expect(next.revealed).toBe(false);
  expect(reconcileAppEntry(signedOut, 'one', true).revealed).toBe(false);
});

it('keeps a restored shopping route covered until that screen reports ready', () => {
  const pending = {
    userId: 'one',
    ready: false,
    revealed: false,
    painted: false,
  };
  const groceryReady = reportAppEntryReady(pending, 'one', true, 'grocery');
  expect(
    reconcileAppEntry(groceryReady, 'one', true, 'shopping').revealed
  ).toBe(false);
  const shoppingReady = reportAppEntryReady(
    groceryReady,
    'one',
    true,
    'shopping'
  );
  // The grocery route stays mounted under Shopping and may clean up later.
  expect(reportAppEntryReady(shoppingReady, 'one', false, 'grocery')).toBe(
    shoppingReady
  );
  expect(
    reconcileAppEntry(shoppingReady, 'one', true, 'shopping').revealed
  ).toBe(true);
});
