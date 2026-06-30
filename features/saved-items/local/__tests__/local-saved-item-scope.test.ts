import { describe, expect, it } from 'vitest';

import {
  dedupeLocalSavedItemsForOwner,
  isLocalSavedItemVisibleForOwner,
} from '../local-saved-item-scope';

const defaultApple = {
  id: 'local-0',
  name: 'Apple',
  ownerId: null,
  isDefault: true,
};

const accountApple = {
  id: 'local-user-account-a-apple',
  name: 'Apple',
  ownerId: 'account-a',
  isDefault: false,
};

const otherAccountBanana = {
  id: 'local-user-account-b-banana',
  name: 'Banana',
  ownerId: 'account-b',
  isDefault: false,
};

describe('local saved item scoping', () => {
  it('shows shared defaults to every owner', () => {
    expect(isLocalSavedItemVisibleForOwner(defaultApple, 'account-a')).toBe(true);
    expect(isLocalSavedItemVisibleForOwner(defaultApple, 'account-b')).toBe(true);
  });

  it('only shows account-owned custom rows to their owner', () => {
    expect(isLocalSavedItemVisibleForOwner(accountApple, 'account-a')).toBe(true);
    expect(isLocalSavedItemVisibleForOwner(accountApple, 'account-b')).toBe(false);
  });

  it('lets account-owned rows override shared defaults by name', () => {
    expect(
      dedupeLocalSavedItemsForOwner(
        [defaultApple, accountApple, otherAccountBanana],
        'account-a'
      )
    ).toEqual([accountApple]);
  });
});
