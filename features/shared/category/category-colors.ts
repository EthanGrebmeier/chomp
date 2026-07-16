export const categoryColorKeys = [
  'red',
  'orange',
  'gold',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
] as const;

export type CategoryColor = (typeof categoryColorKeys)[number];

export const categoryColorOptions: readonly {
  label: string;
  value: CategoryColor;
}[] = [
  { label: 'Red', value: 'red' },
  { label: 'Orange', value: 'orange' },
  { label: 'Gold', value: 'gold' },
  { label: 'Green', value: 'green' },
  { label: 'Teal', value: 'teal' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Pink', value: 'pink' },
];

const categoryTextClassNames: Record<CategoryColor, string> = {
  red: 'text-category-red-foreground-light dark:text-category-red-foreground-dark',
  orange:
    'text-category-orange-foreground-light dark:text-category-orange-foreground-dark',
  gold: 'text-category-gold-foreground-light dark:text-category-gold-foreground-dark',
  green:
    'text-category-green-foreground-light dark:text-category-green-foreground-dark',
  teal: 'text-category-teal-foreground-light dark:text-category-teal-foreground-dark',
  blue: 'text-category-blue-foreground-light dark:text-category-blue-foreground-dark',
  purple:
    'text-category-purple-foreground-light dark:text-category-purple-foreground-dark',
  pink: 'text-category-pink-foreground-light dark:text-category-pink-foreground-dark',
};

const categoryBackgroundClassNames: Record<CategoryColor, string> = {
  red: 'bg-category-red-solid-light dark:bg-category-red-solid-dark',
  orange: 'bg-category-orange-solid-light dark:bg-category-orange-solid-dark',
  gold: 'bg-category-gold-solid-light dark:bg-category-gold-solid-dark',
  green: 'bg-category-green-solid-light dark:bg-category-green-solid-dark',
  teal: 'bg-category-teal-solid-light dark:bg-category-teal-solid-dark',
  blue: 'bg-category-blue-solid-light dark:bg-category-blue-solid-dark',
  purple: 'bg-category-purple-solid-light dark:bg-category-purple-solid-dark',
  pink: 'bg-category-pink-solid-light dark:bg-category-pink-solid-dark',
};

const categorySurfaceClassNames: Record<CategoryColor, string> = {
  red: 'border-category-red-solid-light bg-category-red-surface-light dark:bg-category-red-surface-dark',
  orange:
    'border-category-orange-solid-light bg-category-orange-surface-light dark:bg-category-orange-surface-dark',
  gold: 'border-category-gold-solid-light bg-category-gold-surface-light dark:bg-category-gold-surface-dark',
  green:
    'border-category-green-solid-light bg-category-green-surface-light dark:bg-category-green-surface-dark',
  teal: 'border-category-teal-solid-light bg-category-teal-surface-light dark:bg-category-teal-surface-dark',
  blue: 'border-category-blue-solid-light bg-category-blue-surface-light dark:bg-category-blue-surface-dark',
  purple:
    'border-category-purple-solid-light bg-category-purple-surface-light dark:bg-category-purple-surface-dark',
  pink: 'border-category-pink-solid-light bg-category-pink-surface-light dark:bg-category-pink-surface-dark',
};

export const isCategoryColor = (value: unknown): value is CategoryColor =>
  typeof value === 'string' &&
  categoryColorKeys.includes(value as CategoryColor);

export const getCategoryTextClassName = (color: CategoryColor) =>
  categoryTextClassNames[color];

export const getCategoryBackgroundClassName = (color: CategoryColor) =>
  categoryBackgroundClassNames[color];

export const getCategorySurfaceClassName = (color: CategoryColor) =>
  categorySurfaceClassNames[color];

export const getFallbackCategoryColor = (value: string): CategoryColor => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return categoryColorKeys[hash % categoryColorKeys.length];
};

export const resolveCategoryColor = (
  value: string,
  color?: unknown
): CategoryColor =>
  isCategoryColor(color) ? color : getFallbackCategoryColor(value);
