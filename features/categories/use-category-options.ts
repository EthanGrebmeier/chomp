import { useMemo } from 'react';

import { mergeCategoryOptions } from '../shared/category/categories';

import { useCategories } from './instant/use-categories';

/** Every category the user can pick, built-in and custom, in display order. */
export const useCategoryOptions = () => {
  const { data: records, isLoading, error } = useCategories();
  const categoryOptions = useMemo(
    () => mergeCategoryOptions(records),
    [records]
  );

  return {
    data: categoryOptions,
    isLoading,
    error,
  };
};
