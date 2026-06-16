import { useMemo } from 'react';

import { mergeCategoryOptions } from '../shared/category/categories';

import { useCategories } from './instant/use-categories';

export const useCategoryOptions = () => {
  const { data: categories, isLoading, error } = useCategories();
  const categoryOptions = useMemo(
    () => mergeCategoryOptions(categories),
    [categories]
  );

  return {
    data: categoryOptions,
    customCategories: categories,
    isLoading,
    error,
  };
};
