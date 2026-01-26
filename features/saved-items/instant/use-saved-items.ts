import { db } from '../../../lib/instant';

export const useSavedItems = () => {
  const { user } = db.useAuth();

  const result = db.useQuery(
    user
      ? {
          saved_items: {
            $: {
              where: {
                'user.id': user.id,
              },
            },
            store: {},
          },
        }
      : null
  );

  return {
    ...result,
    data: result.data?.saved_items ?? [],
  };
};

