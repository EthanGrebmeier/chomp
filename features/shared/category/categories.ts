import { CategoryColor, resolveCategoryColor } from './category-colors';

export type CategoryOption = {
  /** Persisted record id; set for custom categories and customized built-ins. */
  id?: string;
  label: string;
  value: string;
  color: CategoryColor;
  isBuiltIn: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type CategoryRecordLike = {
  id: string;
  name: string;
  value: string;
  color?: string;
  isHidden?: boolean;
  createdAt: string;
  updatedAt: string;
};

export const categoryOptions = [
  {
    label: 'Produce',
    value: 'produce',
    color: 'green',
  },
  {
    label: 'Deli',
    value: 'deli',
    color: 'orange',
  },
  {
    label: 'Dairy',
    value: 'dairy',
    color: 'blue',
  },
  {
    label: 'Bakery',
    value: 'bakery',
    color: 'gold',
  },
  {
    label: 'Frozen',
    value: 'frozen',
    color: 'teal',
  },
  {
    label: 'Beverages',
    value: 'beverages',
    color: 'purple',
  },
  {
    label: 'Snacks',
    value: 'snacks',
    color: 'red',
  },
  {
    label: 'Health & Beauty',
    value: 'health-beauty',
    color: 'pink',
  },
  {
    label: 'Household',
    value: 'household',
    color: 'orange',
  },
  {
    label: 'Other',
    value: 'other',
    color: 'purple',
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

const getBuiltInCategoryOption = (value: string) =>
  builtInCategoryOptions.find(option => option.value === value);

export const getCategoryLabel = (
  options: CategoryOption[],
  value?: string | null
) => {
  if (!value) return undefined;
  return (
    getCategoryOptionByValue(options, value)?.label ??
    getBuiltInCategoryOption(value)?.label ??
    getFallbackCategoryLabel(value)
  );
};

export const getCategoryColor = (
  options: CategoryOption[],
  value?: string | null
) => {
  if (!value) return undefined;
  return (
    getCategoryOptionByValue(options, value)?.color ??
    getBuiltInCategoryOption(value)?.color ??
    resolveCategoryColor(value)
  );
};

/**
 * Option for a value that is no longer offered (deleted custom category or
 * hidden built-in) so items referencing it still render sensibly.
 */
export const createMissingCategoryOption = (value: string): CategoryOption =>
  getBuiltInCategoryOption(value) ?? {
    label: getFallbackCategoryLabel(value),
    value,
    color: resolveCategoryColor(value),
    isBuiltIn: false,
  };

/**
 * Combines built-in categories with the user's persisted category records.
 * Records sharing a built-in's value override it (or hide it); the remaining
 * records are custom categories, appended alphabetically after built-ins.
 */
export const mergeCategoryOptions = (
  records: CategoryRecordLike[]
): CategoryOption[] => {
  const overridesByValue = new Map<string, CategoryRecordLike>();
  const customRecords: CategoryRecordLike[] = [];

  records.forEach(record => {
    if (isBuiltInCategoryValue(record.value)) {
      overridesByValue.set(record.value, record);
    } else {
      customRecords.push(record);
    }
  });

  const builtInOptions = builtInCategoryOptions.flatMap<CategoryOption>(
    option => {
      const override = overridesByValue.get(option.value);
      if (!override) return [option];
      if (override.isHidden) return [];
      return [
        {
          ...option,
          id: override.id,
          label: override.name,
          color: resolveCategoryColor(
            option.value,
            override.color ?? option.color
          ),
          createdAt: override.createdAt,
          updatedAt: override.updatedAt,
        },
      ];
    }
  );

  const customOptions = customRecords
    .map(record => ({
      id: record.id,
      label: record.name,
      value: record.value,
      color: resolveCategoryColor(record.value, record.color),
      isBuiltIn: false,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );

  return [...builtInOptions, ...customOptions];
};
