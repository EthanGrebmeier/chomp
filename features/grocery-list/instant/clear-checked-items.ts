import { db } from '../../../lib/instant';

export const clearCheckedItems = async () => {
  const { data: checkedItems } = await db.queryOnce({
    grocery_items: {
      $: {
        where: {
          isChecked: true,
          isDeleted: false,
        },
      },
    },
  });

  return db.transact(
    checkedItems.grocery_items.map(item =>
      db.tx.grocery_items[item.id].update({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      })
    )
  );
};
