import { expect, it } from 'vitest';

import { entryListId, retainEntryLists } from '../app/entry-lists';

it('preloads the requested or most recently opened list before discovery completes', () => {
  const access = { older: '2026-10-01', recent: '2026-10-29' };
  expect(entryListId([], true, undefined, access)).toBe('recent');
  expect(entryListId([], true, 'requested', access)).toBe('requested');
  expect(entryListId([], true, undefined, {})).toBeUndefined();
});

it('discards stale hints after discovery and honors the actual available list order', () => {
  const lists = [{ id: 'first' }, { id: 'second' }];
  expect(entryListId(lists, false, 'deleted', { deleted: '2026-10-29' })).toBe(
    'first'
  );
  expect(entryListId(lists, false, 'second', {})).toBe('second');
  expect(
    entryListId([], false, 'deleted', { deleted: '2026-10-29' })
  ).toBeUndefined();
});

it('keeps the previous editing session mounted across quick list switches', () => {
  const lists = [{ id: 'first' }, { id: 'second' }];
  const started = ['first'];
  expect(retainEntryLists(started, 'first', lists, false)).toBe(started);
  expect(retainEntryLists(started, 'second', lists, false)).toEqual([
    'first',
    'second',
  ]);
  expect(retainEntryLists(started, 'first', [], true)).toBe(started);
});

it('removes sessions that are no longer available after list discovery', () => {
  expect(
    retainEntryLists(['deleted'], 'remaining', [{ id: 'remaining' }], false)
  ).toEqual(['remaining']);
});
