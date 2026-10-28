import { useMemo } from 'react';

import { db } from '../../../lib/instant';

export const useStores = () => {
  const { user } = db.useAuth();

  const result = db.useQuery({
    stores: {
      user: {},
    },
  });

  const stores = result.data?.stores;
  const userId = user?.id;
  const myStores = useMemo(
    () =>
      userId ? (stores?.filter(store => store.user?.id === userId) ?? []) : [],
    [stores, userId]
  );

  if (!user) {
    return {
      data: myStores,
      isLoading: false,
      error: null,
    };
  }

  return {
    ...result,
    data: myStores,
  };
};
