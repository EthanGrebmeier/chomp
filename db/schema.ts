import { relations } from 'drizzle-orm';
import { sqliteTable } from 'drizzle-orm/sqlite-core';

import { int, text } from 'drizzle-orm/sqlite-core';

export const groceryListTable = sqliteTable('grocery_list', {
  id: text().primaryKey(),
  date: text(),
  name: text().notNull(),
});

export const groceryListRelations = relations(groceryListTable, ({ many }) => ({
  items: many(groceryListItemTable),
}));

export const groceryListItemTable = sqliteTable('grocery_list_item', {
  id: text().primaryKey(),
  groceryListId: text()
    .notNull()
    .references(() => groceryListTable.id),
  name: text().notNull(),
  quantity: int().notNull(),
  unit: text({ enum: ['each', 'kg', 'g', 'l', 'ml', 'lb'] }).notNull(),
  isChecked: int({ mode: 'boolean' }).notNull().default(false),
});

export const recipeTable = sqliteTable('recipe', {
  id: text().primaryKey(),
  name: text().notNull(),
  description: text(),
  servings: int(),
  createdAt: text().notNull(),
});

export const recipeRelations = relations(recipeTable, ({ many }) => ({
  ingredients: many(recipeIngredientTable),
}));

export const recipeIngredientTable = sqliteTable('recipe_ingredient', {
  id: text().primaryKey(),
  recipeId: text()
    .notNull()
    .references(() => recipeTable.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  quantity: int().notNull(),
  unit: text({ enum: ['each', 'kg', 'g', 'l', 'ml', 'lb'] }).notNull(),
  notes: text(),
  order: int().notNull().default(0),
});

export const recipeIngredientRelations = relations(
  recipeIngredientTable,
  ({ one }) => ({
    recipe: one(recipeTable, {
      fields: [recipeIngredientTable.recipeId],
      references: [recipeTable.id],
    }),
  })
);
