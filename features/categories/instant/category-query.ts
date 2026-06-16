import { db } from '../../../lib/instant';

export const queryMyCategories = async (userId: string) => {
  const result = await db.queryOnce({
    categories: {
      user: {},
    },
  });

  return (
    result.data.categories?.filter(category => category.user?.id === userId) ?? []
  );
};
