export type Store = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type BaseStore = Omit<Store, 'id' | 'createdAt' | 'updatedAt'>;

