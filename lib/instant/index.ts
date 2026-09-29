import { init } from '@instantdb/react-native';

import schema from '../../instant.schema';

export const db = init({
  appId: process.env.EXPO_PUBLIC_INSTANT_APP_ID!,
  schema,
});

/** One chunk of a batched `db.transact([...])` call. */
export type TransactionChunk = Extract<
  Parameters<typeof db.transact>[0],
  unknown[]
>[number];
