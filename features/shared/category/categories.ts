export type CategoryOption = {
  id?: string;
  label: string;
  value: string;
  isBuiltIn: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type CustomCategoryLike = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

export const categoryOptions = [
  {
    label: 'Produce',
    value: 'produce',
  },
  {
    label: 'Deli',
    value: 'deli',
  },
  {
    label: 'Dairy',
    value: 'dairy',
  },
  {
    label: 'Bakery',
    value: 'bakery',
  },
  {
    label: 'Frozen',
    value: 'frozen',
  },
  {
    label: 'Beverages',
    value: 'beverages',
  },
  {
    label: 'Snacks',
    value: 'snacks',
  },
  {
    label: 'Health & Beauty',
    value: 'health-beauty',
  },
  {
    label: 'Household',
    value: 'household',
  },
  {
    label: 'Other',
    value: 'other',
  },
] as const;
export type Category = (typeof categoryOptions)[number]['value'];

export const builtInCategoryOptions: CategoryOption[] = categoryOptions.map(
  option => ({
    ...option,
    isBuiltIn: true,
  })
);

const builtInCategoryValues = new Set<string>(
  categoryOptions.map(option => option.value)
);

export const normalizeCategoryName = (name: string) =>
  name.trim().replace(/\s+/g, ' ');

export const getCategoryNameKey = (name: string) =>
  normalizeCategoryName(name).toLowerCase();

const builtInCategoryNameKeys = new Set<string>(
  categoryOptions.map(option => getCategoryNameKey(option.label))
);

export const createCategoryValueFromName = (name: string) => {
  const value = normalizeCategoryName(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return value || 'category';
};

export const isBuiltInCategoryValue = (value?: string | null) =>
  value ? builtInCategoryValues.has(value) : false;

export const isBuiltInCategoryName = (name: string) =>
  builtInCategoryNameKeys.has(getCategoryNameKey(name));

export const getFallbackCategoryLabel = (value: string) =>
  normalizeCategoryName(value)
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || value;

export const getCategoryOptionByValue = (
  options: CategoryOption[],
  value?: string | null
) => {
  if (!value) return undefined;
  return options.find(option => option.value === value);
};

export const getCategoryLabel = (
  options: CategoryOption[],
  value?: string | null
) => {
  if (!value) return undefined;
  return getCategoryOptionByValue(options, value)?.label ?? getFallbackCategoryLabel(value);
};

export const createMissingCategoryOption = (value: string): CategoryOption => ({
  label: getFallbackCategoryLabel(value),
  value,
  isBuiltIn: false,
});

export const mergeCategoryOptions = (
  customCategories: CustomCategoryLike[]
): CategoryOption[] => {
  const customOptions = customCategories
    .map(category => ({
      id: category.id,
      label: category.name,
      value: category.value,
      isBuiltIn: false,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );

  return [...builtInCategoryOptions, ...customOptions];
};
