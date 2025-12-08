import { db } from '../../../lib/instant';

export const useGroceryLists = () => {
  const query = { grocery_lists: {} };

  return db.useQuery(query);
};
