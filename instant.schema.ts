// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from '@instantdb/react-native';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string(),
      hasInitializedSavedItems: i.boolean().optional(),
    }),
    saved_items: i.entity({
      name: i.string(),
      category: i.string().optional(),
      createdAt: i.string(),
      updatedAt: i.string(),
    }),
    grocery_lists: i.entity({
      name: i.string(),
      joinCode: i.string().unique(), // 8-char alphanumeric, case-sensitive
      ownerId: i.string(),
      createdAt: i.string(),
      updatedAt: i.string(),
    }),
    grocery_items: i.entity({
      name: i.string(),
      quantity: i.number(),
      unit: i.string(),
      notes: i.string().optional(),
      category: i.string().optional(),
      isChecked: i.boolean(),
      createdAt: i.string(),
      updatedAt: i.string(),
      isDeleted: i.boolean(),
      deletedAt: i.string().optional(),
    }),
    grocery_list_shares: i.entity({
      grocery_list_id: i.string(),
      user_id: i.string(),
    }),
    recipes: i.entity({
      name: i.string(),
      description: i.string(),
      imageSrc: i.string(),
      visibility: i.string(),
      createdAt: i.string(),
      updatedAt: i.string(),
    }),
    recipe_ingredients: i.entity({
      name: i.string(),
      quantity: i.number(),
      unit: i.string(),
      notes: i.string().optional(),
      category: i.string().optional(),
      order: i.number(),
    }),
    meal_plans: i.entity({
      name: i.string(),
      startDate: i.string(),
      endDate: i.string(),
      isArchived: i.boolean(),
      createdAt: i.string(),
      updatedAt: i.string(),
    }),
    meal_plan_recipes: i.entity({
      mealTag: i.string().optional(), // 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert'
      date: i.string(),
      servings: i.number(),
      order: i.number(),
      createdAt: i.string(),
      updatedAt: i.string(),
    }),
  },
  links: {
    grocery_listsGrocery_items: {
      forward: {
        on: 'grocery_lists',
        has: 'many',
        label: 'grocery_items',
      },
      reverse: {
        on: 'grocery_items',
        has: 'one',
        label: 'grocery_list',
        onDelete: 'cascade',
      },
    },
    recipe_ingredients_recipes: {
      forward: {
        on: 'recipe_ingredients',
        has: 'one',
        label: 'recipe',
        onDelete: 'cascade',
      },
      reverse: {
        on: 'recipes',
        has: 'many',
        label: 'recipe_ingredients',
      },
    },
    grocery_items_recipes: {
      forward: {
        on: 'grocery_items',
        has: 'one',
        label: 'recipe',
      },
      reverse: {
        on: 'recipes',
        has: 'many',
        label: 'grocery_items',
      },
    },
    grocery_list_shares_grocery_lists: {
      forward: {
        on: 'grocery_list_shares',
        has: 'one',
        label: 'grocery_list',
        onDelete: 'cascade',
      },
      reverse: {
        on: 'grocery_lists',
        has: 'many',
        label: 'shares',
      },
    },
    meal_plan_recipes_meal_plans: {
      forward: {
        on: 'meal_plan_recipes',
        has: 'one',
        label: 'meal_plan',
        onDelete: 'cascade',
      },
      reverse: {
        on: 'meal_plans',
        has: 'many',
        label: 'meal_plan_recipes',
      },
    },
    meal_plan_recipes_recipes: {
      forward: {
        on: 'meal_plan_recipes',
        has: 'one',
        label: 'recipe',
      },
      reverse: {
        on: 'recipes',
        has: 'many',
        label: 'meal_plan_recipes',
      },
    },
    saved_items_users: {
      forward: {
        on: 'saved_items',
        has: 'one',
        label: 'user',
        onDelete: 'cascade',
      },
      reverse: {
        on: '$users',
        has: 'many',
        label: 'saved_items',
      },
    },
  },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
