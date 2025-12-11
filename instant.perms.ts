import { InstantRules } from '@instantdb/react-native';

const rules = {
  grocery_lists: {
    allow: {
      create: 'true',
      view: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', "auth.id in data.ref('shares.user_id')"],
  },
  grocery_items: {
    allow: {
      create: 'isOwner',
      view: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', "auth.id in data.ref('grocery_list.shares.user_id')"],
  },
  recipe_ingredients: {
    allow: {
      create: 'true',
      view: 'true',
      update: 'true',
      delete: 'true',
    },
  },
  recipes: {
    allow: {
      create: 'true',
      view: 'true || data.visibility == "public"',
      update: 'true',
      delete: 'true',
    },
  },
} satisfies InstantRules;

export default rules;
