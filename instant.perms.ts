import { InstantRules } from '@instantdb/react-native';

const rules = {
  grocery_lists: {
    allow: {
      create: 'isOwner',
      view: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', 'user.id == data.userId'],
  },
  grocery_items: {
    allow: {
      create: 'isOwner',
      view: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', 'user.id == data.userId'],
  },
  recipe_ingredients: {
    allow: {
      create: 'isOwner',
      view: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', 'user.id == data.userId'],
  },
  recipes: {
    allow: {
      create: 'isOwner',
      view: 'isOwner || data.visibility == "public"',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', 'user.id == data.userId'],
  },
} satisfies InstantRules;

export default rules;
