import { relations } from 'drizzle-orm';
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Common timestamps for all tables
const timestamps = {
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
};

// App-wide settings table (singleton)
export const appSettingsTable = sqliteTable('app_settings', {
  id: text().primaryKey().default('default'),
  listName: text().notNull().default('Shopping List'),
  groupBy: text({ enum: ['category', 'none', 'recipe', 'store'] })
    .notNull()
    .default('none'),
  sortBy: text({ enum: ['name', 'recent'] })
    .notNull()
    .default('recent'),
  hasSeededSavedItems: int({ mode: 'boolean' }).notNull().default(false),
  // Saved items view settings
  savedItemsSortBy: text({ enum: ['name', 'category'] })
    .notNull()
    .default('name'),
  savedItemsFilterCategory: text(),
  ...timestamps,
});

export const groceryListItemTable = sqliteTable('grocery_list_item', {
  id: text().primaryKey(),
  name: text().notNull(),
  quantity: int().notNull(),
  unit: text({ enum: ['each', 'kg', 'g', 'l', 'ml', 'lb'] }).notNull(),
  notes: text(),
  category: text(),
  recipeId: text().references(() => recipeTable.id),
  isChecked: int({ mode: 'boolean' }).notNull().default(false),
  ...timestamps,
});

export const recipeTable = sqliteTable('recipe', {
  id: text().primaryKey(),
  name: text().notNull(),
  description: text(),
  imageSrc: text(),
  ...timestamps,
});

export const recipeIngredientTable = sqliteTable('recipe_ingredient', {
  id: text().primaryKey(),
  recipeId: text()
    .notNull()
    .references(() => recipeTable.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  quantity: int().notNull(),
  unit: text({ enum: ['each', 'kg', 'g', 'l', 'ml', 'lb'] }).notNull(),
  notes: text(),
  category: text(),
  order: int().notNull().default(0),
  ...timestamps,
});

export const mealPlanTable = sqliteTable('meal_plan', {
  id: text().primaryKey(),
  name: text().notNull(),
  startDate: text().notNull(),
  endDate: text().notNull(),
  isArchived: int({ mode: 'boolean' }).notNull().default(false),
  ...timestamps,
});

export const mealPlanRecipeTable = sqliteTable('meal_plan_recipe', {
  id: text().primaryKey(),
  mealPlanId: text()
    .notNull()
    .references(() => mealPlanTable.id, { onDelete: 'cascade' }),
  recipeId: text()
    .notNull()
    .references(() => recipeTable.id, { onDelete: 'cascade' }),
  mealTag: text({ enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'] }),
  date: text().notNull(),
  servings: int().notNull().default(1),
  order: int().notNull().default(0),
  ...timestamps,
});

export const mealPlanRecipeRelations = relations(
  mealPlanRecipeTable,
  ({ one }) => ({
    mealPlan: one(mealPlanTable, {
      fields: [mealPlanRecipeTable.mealPlanId],
      references: [mealPlanTable.id],
    }),
    recipe: one(recipeTable, {
      fields: [mealPlanRecipeTable.recipeId],
      references: [recipeTable.id],
    }),
  })
);

// Relations
export const groceryListItemRelations = relations(
  groceryListItemTable,
  ({ one }) => ({
    recipe: one(recipeTable, {
      fields: [groceryListItemTable.recipeId],
      references: [recipeTable.id],
    }),
  })
);

export const recipeRelations = relations(recipeTable, ({ many }) => ({
  ingredients: many(recipeIngredientTable),
}));

export const recipeIngredientRelations = relations(
  recipeIngredientTable,
  ({ one }) => ({
    recipe: one(recipeTable, {
      fields: [recipeIngredientTable.recipeId],
      references: [recipeTable.id],
    }),
  })
);

export const mealPlanRelations = relations(mealPlanTable, ({ many }) => ({
  recipes: many(mealPlanRecipeTable),
}));

// Local saved items (default grocery items stored locally to save cloud storage)
export const localSavedItemTable = sqliteTable('local_saved_item', {
  id: text().primaryKey(),
  name: text().notNull(),
  category: text(),
  notes: text(),
  storeId: text(),
  ...timestamps,
});
