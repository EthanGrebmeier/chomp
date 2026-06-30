import { InstaQLEntity } from '@instantdb/react-native';

import schema from '../../instant.schema';

export type SavedItem = InstaQLEntity<typeof schema, 'saved_items'>;

export type BaseSavedItem = {
  name: string;
  category?: string;
  notes?: string;
  storeId?: string;
};

/**
 * A unified saved item that can come from either local SQLite or InstantDB cloud.
 * The `source` field indicates where the item is stored.
 */
export type UnifiedSavedItem = {
  id: string;
  name: string;
  category?: string;
  notes?: string;
  storeId?: string;
  store?: { id: string; name: string };
  source: 'local' | 'cloud';
  /**
   * Owner user id of the underlying saved_item or account-scoped local row.
   * Shared default local rows do not have an owner id.
   */
  ownerId?: string;
  /**
   * Whether a local row is part of the shared seeded grocery catalog.
   */
  isDefault?: boolean;
};

