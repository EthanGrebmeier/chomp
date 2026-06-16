export type CustomCategory = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

export type BaseCustomCategory = Omit<
  CustomCategory,
  'id' | 'createdAt' | 'updatedAt'
>;
