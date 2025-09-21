export type GroceryList = {
  date: string;
  items: GroceryListItem[];
};

export type GroceryListItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};
