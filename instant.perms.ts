// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from '@instantdb/react-native';

const rules = {
  // Matches production. Retain deny-all rules for retired probe namespaces.
  gqc_operations_v1: {
    allow: {
      view: "size(data.ref('workspace.appListId')) == 1 ? auth.id in data.ref('workspace.groceryList.shares.user_id') : auth.id in data.ref('workspace.memberIds')[0]",
      create:
        "auth.id == data.authorId && size(data.ref('workspace.id')) == 1 && data.workspaceId in data.ref('workspace.id') && (data.serialKey == null || data.serialKey.startsWith(data.workspaceId + ':')) && (size(data.ref('workspace.appListId')) == 1 ? (data.serialKey != null && auth.id in data.ref('workspace.groceryList.shares.user_id')) : auth.id in data.ref('workspace.memberIds')[0]) && size(data.body) < 200000",
      update: 'false',
      $default: 'false',
    },
  },
  qty02_probe_rows: {
    allow: {
      $default: 'false',
    },
  },
  qty02_probe_private: {
    allow: {
      $default: 'false',
    },
  },
  qty02_probe_entries: {
    allow: {
      $default: 'false',
    },
  },
  qty02_probe_lists: {
    allow: {
      $default: 'false',
    },
  },
  gqc_workspaces_v1: {
    allow: {
      view: "data.appListId != null ? auth.id in data.ref('groceryList.shares.user_id') : auth.id in data.memberIds",
      create:
        "auth.id != null && data.ownerId == auth.id && auth.id in data.memberIds && (data.appListId != null ? (data.appListId == data.id && data.id in data.ref('groceryList.id') && auth.id in data.ref('groceryList.shares.user_id')) : size(data.ref('groceryList.id')) == 0)",
      update:
        "size(data.ref('groceryList.id')) == 0 && data.appListId == null && newData.appListId == null && data.ownerId == auth.id && newData.ownerId == data.ownerId && auth.id in newData.memberIds",
      $default: 'false',
    },
  },
  qty02_probe_sources: {
    allow: {
      $default: 'false',
    },
  },
  qty02_probe_receipts: {
    allow: {
      $default: 'false',
    },
  },
  grocery_items: {
    bind: ['isOwner', "auth.id in data.ref('grocery_list.shares.user_id')"],
    allow: {
      view: 'isOwner',
      create: 'isOwner',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  grocery_item_add_events: {
    bind: ['isMember', "auth.id in data.ref('grocery_list.shares.user_id')"],
    allow: {
      view: 'isMember',
      create: 'isMember',
      delete: 'isMember',
      update: 'isMember',
    },
  },
  $users: {
    bind: ['isSelf', 'auth.id == data.id'],
    allow: {
      view: 'isSelf',
      create: 'isSelf',
      update: 'isSelf',
    },
  },
  recipes: {
    bind: [
      'isOwner',
      "auth.id in data.ref('user.id')",
      'canViewViaGroceryList',
      "auth.id in data.ref('grocery_items.grocery_list.shares.user_id')",
      // Share links carry the recipe id; the import screen passes it back as a
      // rule param, so knowing the id (from the link) is what grants read access.
      'isOpenedFromShareLink',
      'ruleParams.sharedRecipeId == data.id',
    ],
    allow: {
      view: 'isOwner || data.visibility == "public" || canViewViaGroceryList || isOpenedFromShareLink',
      create: 'auth.id != null',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  meal_plan_items: {
    bind: ['isOwner', "auth.id in data.ref('grocery_list.shares.user_id')"],
    allow: {
      view: 'isOwner',
      create: 'isOwner',
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
  categories: {
    bind: ['isOwner', "auth.id in data.ref('user.id')"],
    allow: {
      view: 'isOwner',
      create: 'auth.id != null',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  meal_plan_recipes: {
    bind: ['isOwner', "auth.id in data.ref('grocery_list.shares.user_id')"],
    allow: {
      view: 'isOwner',
      create: 'isOwner',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  meal_plan_recipe_ingredient_snapshots: {
    bind: [
      'isOwner',
      "auth.id in data.ref('meal_plan_recipe.grocery_list.shares.user_id')",
    ],
    allow: {
      view: 'isOwner',
      create: 'isOwner',
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
  // Lockdown new attributes from being created
  attrs: { allow: { $default: 'false' } },
} satisfies InstantRules;

export default rules;
