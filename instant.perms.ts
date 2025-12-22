import { InstantRules } from '@instantdb/react-native';

const rules = {
  grocery_lists: {
    allow: {
      create: 'true',
      view: 'isMember || isKnownList',
      update: 'isMember || isKnownList',
      delete: 'isOwner && hasMultipleLists',
    },
    bind: [
      'isOwner',
      'auth.id == data.ownerId',
      'isMember',
      "auth.id in data.ref('shares.user_id')",
      'isKnownList',
      'data.joinCode == ruleParams.knownJoinCode',
      'hasMultipleLists',
      "size(data.ref('owner.grocery_lists.id')) > 1",
    ],
  },
  grocery_list_shares: {
    allow: {
      create: 'auth.id != null',
      view: 'auth.id == data.user_id',
      update: 'false',
      delete: 'auth.id == data.user_id',
    },
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
      create: 'isOwner',
      view: 'true',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', "auth.id in data.ref('recipe.user.id')"],
  },
  recipes: {
    allow: {
      create: 'auth.id != null',
      view: 'isOwner || data.visibility == "public"',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', "auth.id in data.ref('user.id')"],
  },
  meal_plans: {
    allow: {
      create: 'auth.id != null',
      view: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', "auth.id in data.ref('user.id')"],
  },
  meal_plan_recipes: {
    allow: {
      create: 'isOwner',
      view: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', "auth.id in data.ref('meal_plan.user.id')"],
  },
  saved_items: {
    allow: {
      create: 'isOwner',
      view: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', "auth.id in data.ref('user.id')"],
  },
} satisfies InstantRules;

export default rules;
