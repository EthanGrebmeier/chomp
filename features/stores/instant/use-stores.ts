import { db } from '../../../lib/instant';

export const useStores = () => {
  const { user } = db.useAuth();

  const result = db.useQuery({
    stores: {
      user: {},
    },
  });

  if (!user) {
    return {
      data: [],
      isLoading: false,
      error: null,
    };
  }

  const myStores =
    result.data?.stores?.filter(store => store.user?.id === user.id) ?? [];

  return {
    ...result,
    data: myStores,
  };
};
