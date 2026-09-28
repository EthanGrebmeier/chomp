import { CategoryColor } from '../shared/category/category-colors';

/**
 * A persisted row in the `categories` entity. When `value` matches a built-in
 * category it acts as an override of that built-in (rename, recolor, or hide);
 * otherwise it is a user-created category.
 */
export type CategoryRecord = {
  id: string;
  name: string;
  value: string;
  color?: CategoryColor;
  isHidden?: boolean;
  createdAt: string;
  updatedAt: string;
};
