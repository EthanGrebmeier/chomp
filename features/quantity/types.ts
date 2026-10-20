/** Contribution authority. No document stores an aggregate shopping quantity. */
export type ShoppingList = { kind: 'list'; id: string; name: string };
export type ShoppingRow = {
  kind: 'row';
  id: string;
  listId: string;
  name: string;
  unit: string;
  notes: string;
  category: string;
  store: string;
  status: 'active' | 'checked' | 'deleted';
};
export type Ingredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string;
  category: string;
  store: string;
};
export type Recipe = {
  kind: 'recipe';
  id: string;
  name: string;
  ingredients: Ingredient[];
};
export type PlannedIngredient = Ingredient & {
  recipeIngredientId: string | null;
  selected: boolean;
  overridden: boolean;
};
export type Meal = {
  kind: 'meal';
  id: string;
  listId: string;
  name: string;
  recipeId: string | null;
  date: string;
  mealTag: string;
  servings: number;
  ingredients: PlannedIngredient[];
};
export type QuantityEntry = {
  kind: 'entry';
  id: string;
  rowId: string;
  quantity: number;
  unit: string;
  /** Original source spelling; row matching always uses the normalized unit. */
  sourceUnit?: string;
  origin: 'manual' | 'recipe' | 'scheduled' | 'planned';
  sourceName: string;
  sourceNotes: string;
  sourceDate: string;
  mealTag: string;
  sourceId: string | null;
  mealId: string | null;
};
export type Document =
  | ShoppingList
  | ShoppingRow
  | QuantityEntry
  | Recipe
  | Meal;
export type Versioned<T extends Document = Document> = T & { version: string };
export type Change = {
  id: string;
  before: string | null;
  value: Document | null;
};
export type Guard =
  | { kind: 'version'; id: string; version: string }
  | { kind: 'entries'; rowId: string; versions: string[] };
export type Operation = {
  id: string;
  parents: string[];
  label: string;
  changes: Change[];
  guards: Guard[];
  resolves: string[];
};
export type Conflict = { operation: Operation; reason: string };
export type QuantityState = {
  documents: Record<string, Versioned>;
  heads: string[];
  conflicts: Conflict[];
  complete: boolean;
  error: string | null;
};
