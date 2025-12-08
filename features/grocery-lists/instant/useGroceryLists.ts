import { db } from '../../../lib/instant';

export const useGroceryLists = () => {
  const query = {
    grocery_lists: {
      grocery_items: {},
    },
  };

  return db.useQuery(query);
};
