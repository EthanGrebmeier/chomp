import { i } from '@instantdb/react-native';

export const schema = i.schema({
  entities: {
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
    }),
    recipes: i.entity({
      name: i.string(),
      description: i.string(),
      imageSrc: i.string(),
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
    grocery_lists_grocery_items: {
      forward: {
        on: 'grocery_lists',
        has: 'many',
        label: 'grocery_items',
        onDelete: 'cascade',
      },
      reverse: {
        on: 'grocery_items',
        has: 'one',
        label: 'grocery_lists',
      },
    },
    recipes_recipe_ingredients: {
      forward: {
        on: 'recipes',
        has: 'many',
        label: 'recipe_ingredients',
        onDelete: 'cascade',
      },
      reverse: {
        on: 'recipe_ingredients',
        has: 'one',
        label: 'recipes',
      },
    },
    grocery_items_recipes: {
      forward: {
        on: 'grocery_items',
        has: 'one',
        label: 'recipes',
      },
      reverse: {
        on: 'recipes',
        has: 'many',
        label: 'grocery_items',
      },
    },
  },
});
