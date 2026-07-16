import { CategoryColor } from '../shared/category/category-colors';

export type CustomCategory = {
  id: string;
  name: string;
  value: string;
  color?: CategoryColor;
  createdAt: string;
  updatedAt: string;
};

export type BaseCustomCategory = Omit<
  CustomCategory,
  'id' | 'createdAt' | 'updatedAt'
>;
