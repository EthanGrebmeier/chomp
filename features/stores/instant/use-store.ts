import { db } from '../../../lib/instant';

export const useStore = (storeId: string | null) => {
  const result = db.useQuery(
    storeId
      ? {
          stores: {
            $: {
              where: {
                id: storeId,
              },
            },
          },
        }
      : null
  );

  return {
    ...result,
    data: result.data?.stores?.[0] ?? null,
  };
};

