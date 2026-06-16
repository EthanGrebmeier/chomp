import { db } from '../../../lib/instant';

export type DeleteCategoryArgs = {
  categoryId: string;
};

export const deleteCategory = async ({ categoryId }: DeleteCategoryArgs) => {
  await db.transact([db.tx.categories[categoryId].delete()]);
};
