import { relations } from 'drizzle-orm';
import { sqliteTable } from 'drizzle-orm/sqlite-core';

import { int, text } from 'drizzle-orm/sqlite-core';

// Common timestamps for all tables
const timestamps = {
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
};

export const itemTable = sqliteTable('item', {
  id: text().primaryKey(),
  name: text().notNull(),
  quantity: int().notNull(),
  unit: text({ enum: ['each', 'kg', 'g', 'l', 'ml', 'lb'] }).notNull(),
  notes: text(),
  category: text(),
  ...timestamps,
});

export const groceryListTable = sqliteTable('grocery_list', {
  id: text().primaryKey(),
  date: text(),
  name: text().notNull(),
  groupBy: text({ enum: ['category', 'none', 'recipe'] })
    .notNull()
    .default('none'),
  ...timestamps,
});

export const groceryListItemTable = sqliteTable('grocery_list_item', {
  id: text().primaryKey(),
  groceryListId: text()
    .notNull()
    .references(() => groceryListTable.id),
  itemId: text()
    .notNull()
    .references(() => itemTable.id),
  recipeId: text().references(() => recipeTable.id),
  isChecked: int({ mode: 'boolean' }).notNull().default(false),
  ...timestamps,
});

export const recipeTable = sqliteTable('recipe', {
  id: text().primaryKey(),
  name: text().notNull(),
  description: text(),
  ...timestamps,
});

export const recipeIngredientTable = sqliteTable('recipe_ingredient', {
  id: text().primaryKey(),
  recipeId: text()
    .notNull()
    .references(() => recipeTable.id, { onDelete: 'cascade' }),
  itemId: text()
    .notNull()
    .references(() => itemTable.id),
  order: int().notNull().default(0),
  ...timestamps,
});

export const mealPlanTable = sqliteTable('meal_plan', {
  id: text().primaryKey(),
  groceryListId: text().references(() => groceryListTable.id),
  name: text().notNull(),
  startDate: text().notNull(),
  endDate: text().notNull(),
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
  mealTag: text({ enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] }),
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
export const itemRelations = relations(itemTable, ({ many }) => ({
  groceryListItems: many(groceryListItemTable),
  recipeIngredients: many(recipeIngredientTable),
}));

export const groceryListRelations = relations(groceryListTable, ({ many }) => ({
  items: many(groceryListItemTable),
}));

export const groceryListItemRelations = relations(
  groceryListItemTable,
  ({ one }) => ({
    groceryList: one(groceryListTable, {
      fields: [groceryListItemTable.groceryListId],
      references: [groceryListTable.id],
    }),
    item: one(itemTable, {
      fields: [groceryListItemTable.itemId],
      references: [itemTable.id],
    }),
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
    item: one(itemTable, {
      fields: [recipeIngredientTable.itemId],
      references: [itemTable.id],
    }),
  })
);

export const mealPlanRelations = relations(mealPlanTable, ({ one, many }) => ({
  groceryList: one(groceryListTable, {
    fields: [mealPlanTable.groceryListId],
    references: [groceryListTable.id],
  }),
  recipes: many(mealPlanRecipeTable),
}));
