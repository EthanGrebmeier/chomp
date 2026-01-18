// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from '@instantdb/react-native';

const rules = {
  grocery_items: {
    bind: ['isOwner', "auth.id in data.ref('grocery_list.shares.user_id')"],
    allow: {
      view: 'isOwner',
      create: 'isOwner',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  $users: {
    bind: [
      'isSelf',
      'auth.id == data.id',
    ],
    allow: {
      view: 'isSelf',
      create: 'false',
      update: 'isSelf',
    },
  },
  recipes: {
    bind: [
      'isOwner',
      "auth.id in data.ref('user.id')",
      'canViewViaGroceryList',
      "auth.id in data.ref('grocery_items.grocery_list.shares.user_id')",
    ],
    allow: {
      view: 'isOwner || data.visibility == "public" || canViewViaGroceryList',
      create: 'auth.id != null',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  meal_plan_items: {
    bind: ['isOwner', "auth.id in data.ref('user.id')"],
    allow: {
      view: 'isOwner',
      create: 'auth.id != null',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  grocery_lists: {
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
    allow: {
      view: 'isOwner || isMember || isKnownList',
      create: 'true',
      delete: 'isOwner && hasMultipleLists',
      update: 'isOwner || isMember',
    },
  },
  stores: {
    bind: [
      'isOwner',
      "auth.id in data.ref('user.id')",
      'canViewViaItem',
      "auth.id in data.ref('grocery_items.grocery_list.shares.user_id')",
    ],
    allow: {
      view: 'isOwner || canViewViaItem',
      create: 'auth.id != null',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  meal_plan_recipes: {
    bind: ['isOwner', "auth.id in data.ref('user.id')"],
    allow: {
      view: 'isOwner',
      create: 'auth.id != null',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  saved_items: {
    bind: ['isOwner', "auth.id in data.ref('user.id')"],
    allow: {
      view: 'isOwner',
      create: 'isOwner',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  recipe_ingredients: {
    bind: ['isOwner', "auth.id in data.ref('recipe.user.id')"],
    allow: {
      view: 'true',
      create: 'isOwner',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  grocery_list_shares: {
    bind: [
      'isMember',
      "auth.id in data.ref('grocery_list.shares.user_id')",
      'isSelf',
      'auth.id == data.user_id',
    ],
    allow: {
      view: 'isSelf || isMember',
      create: 'isSelf',
      delete: 'isSelf',
      update: 'isSelf',
    },
  },
} satisfies InstantRules;

export default rules;
