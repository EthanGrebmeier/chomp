import { db } from '../../../lib/instant';

export const clearGroceryList = async ({ listId }: { listId: string }) => {
  const activeItems = await db.queryOnce({
    grocery_items: {
      $: {
        where: {
          isDeleted: false,
          'grocery_lists.id': listId,
        },
      },
    },
  });

  return db.transact(
    activeItems.data.grocery_items.map(item =>
      db.tx.grocery_items[item.id].update({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      })
    )
  );
};
