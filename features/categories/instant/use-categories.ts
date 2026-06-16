import { db } from '../../../lib/instant';

export const useCategories = () => {
  const { user } = db.useAuth();

  const result = db.useQuery({
    categories: {
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

  const myCategories =
    result.data?.categories?.filter(category => category.user?.id === user.id) ??
    [];

  return {
    ...result,
    data: myCategories,
  };
};
