// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from '@instantdb/react-native';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string(),
    }),
    grocery_lists: i.entity({
      name: i.string(),
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
        label: 'grocery_lists',
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
  },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
