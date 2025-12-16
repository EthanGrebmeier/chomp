import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { groceries } from '../../grocery-list/consts/groceries';

const CHUNK_SIZE = 100;

/**
 * Split an array into chunks of a specified size.
 */
function chunk<T>(array: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size) as T[]);
  }
  return chunks;
}

/**
 * Initialize saved items for a new user with the default grocery items.
 * This should only be called once per user, when they first sign in.
 * Items are processed in chunks to avoid transaction size limits.
 */
export const initializeSavedItems = async (userId: string) => {
  const now = new Date().toISOString();

  // Split groceries into chunks
  const groceryChunks = chunk(groceries, CHUNK_SIZE);

  // Process each chunk sequentially
  for (const groceryChunk of groceryChunks) {
    const transactions = [];

    for (const grocery of groceryChunk) {
      const itemId = id();
      transactions.push(
        db.tx.saved_items[itemId].update({
          name: grocery.name,
          category: grocery.category,
          createdAt: now,
          updatedAt: now,
        }),
        db.tx.saved_items[itemId].link({
          user: userId,
        })
      );
    }

    // Execute this chunk's transactions
    await db.transact(transactions);
  }

  // After all chunks are processed, mark user as having initialized saved items
  await db.transact([
    db.tx.$users[userId].update({
      hasInitializedSavedItems: true,
    }),
  ]);
};
