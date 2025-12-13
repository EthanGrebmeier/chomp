import { groceries } from '../../features/grocery-list/consts/groceries';

export const useMatchingItems = (value: string) => {
  const matchingItems =
    value.length > 0
      ? groceries
          .filter(item => item.name.toLowerCase().includes(value.toLowerCase()))
          .slice(0, 7)
          .sort((a, b) => b.name.localeCompare(a.name))
      : [];
  return { matchingItems };
};
