import { InstaQLEntity } from '@instantdb/react-native';

import schema from '../../instant.schema';

export type SavedItem = InstaQLEntity<typeof schema, 'saved_items'>;

export type BaseSavedItem = {
  name: string;
  category?: string;
};

