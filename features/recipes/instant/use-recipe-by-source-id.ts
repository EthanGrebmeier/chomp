import { db } from '../../../lib/instant';

export const useRecipeBySourceId = (sourceRecipeId: string | undefined) => {
  const { user } = db.useAuth();

  return db.useQuery(
    user && sourceRecipeId
      ? {
          recipes: {
            $: {
              where: {
                sourceRecipeId,
                'user.id': user.id,
              },
            },
          },
        }
      : null
  );
};
