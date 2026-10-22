import { describe, expect, it } from 'vitest';

import {
  hasSavedItemLink,
  keepSelectedItemForTitle,
} from '../saved-item-intent';
import type { MatchingItem } from '../use-matching-items';

const apple: MatchingItem = {
  name: 'Apple',
  quantity: 1,
  unit: 'each',
  source: 'cloud',
  cloudSavedItemId: 'apple',
};

describe('saved item intent', () => {
  it('keeps the picked item for whitespace or casing edits', () => {
    expect(keepSelectedItemForTitle(apple, ' apple ')).toBe(apple);
  });

  it('detaches a different title and does not silently relink when retyped', () => {
    const detached = keepSelectedItemForTitle(apple, 'Apple juice');
    expect(detached).toBeNull();
    expect(hasSavedItemLink(detached)).toBe(false);
    expect(keepSelectedItemForTitle(detached, 'Apple')).toBeNull();
  });

  it('recognizes a fresh suggestion after editing a previous pick', () => {
    const pear = { ...apple, name: 'Pear', cloudSavedItemId: 'pear' };
    expect(keepSelectedItemForTitle(apple, 'Pe')).toBeNull();
    expect(hasSavedItemLink(pear)).toBe(true);
    expect(keepSelectedItemForTitle(pear, 'Pear')).toBe(pear);
  });

  it('requires an actual saved identity for sync', () => {
    expect(hasSavedItemLink({ ...apple, cloudSavedItemId: undefined })).toBe(
      false
    );
    expect(
      hasSavedItemLink({ ...apple, source: 'local', localSavedItemId: 'local' })
    ).toBe(true);
  });
});
