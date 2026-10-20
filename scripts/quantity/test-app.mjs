import { randomUUID } from 'node:crypto';
import { init } from '@instantdb/admin';

export const TEST_APP = '5df33e29-252b-4e1c-a111-53787beccba3';
export const names = {
  workspaces: 'gqc_workspaces_v1',
  operations: 'gqc_operations_v1',
};
export function testApp() {
  if (
    process.env.EXPO_PUBLIC_INSTANT_APP_ID !== TEST_APP ||
    !process.env.INSTANT_APP_ADMIN_TOKEN ||
    !process.argv.includes('--test-app')
  )
    throw new Error('Requires --test-app and the allowlisted development app');
  const token = process.env.INSTANT_APP_ADMIN_TOKEN;
  const db = init({ appId: TEST_APP, adminToken: token });
  const api = async (path, method = 'GET', body) => {
    const response = await fetch(`https://api.instantdb.com${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'app-id': TEST_APP,
        'content-type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok)
      throw new Error(`Isolated test API failed (${response.status})`);
    return response.json();
  };
  return { db, api };
}

export const workspaceRules = {
  [names.workspaces]: {
    allow: {
      $default: 'false',
      view: "data.appListId != null ? auth.id in data.ref('groceryList.shares.user_id') : auth.id in data.memberIds",
      create:
        "auth.id != null && data.ownerId == auth.id && auth.id in data.memberIds && (data.appListId != null ? (data.appListId == data.id && data.id in data.ref('groceryList.id') && auth.id in data.ref('groceryList.shares.user_id')) : size(data.ref('groceryList.id')) == 0)",
      update:
        "size(data.ref('groceryList.id')) == 0 && data.appListId == null && newData.appListId == null && data.ownerId == auth.id && newData.ownerId == data.ownerId && auth.id in newData.memberIds",
    },
  },
  [names.operations]: {
    allow: {
      $default: 'false',
      view: "size(data.ref('workspace.appListId')) == 1 ? auth.id in data.ref('workspace.groceryList.shares.user_id') : auth.id in data.ref('workspace.memberIds')[0]",
      create:
        "auth.id == data.authorId && size(data.ref('workspace.id')) == 1 && data.workspaceId in data.ref('workspace.id') && (size(data.ref('workspace.appListId')) == 1 ? auth.id in data.ref('workspace.groceryList.shares.user_id') : auth.id in data.ref('workspace.memberIds')[0]) && size(data.body) < 200000",
      // Intents are create-only, including their permission links. modifiedFields
      // does not fence unlink operations. The outbox recognizes exact retries by
      // reading the existing author/scope/body instead of rewriting the record.
      update: 'false',
    },
  },
};

export function workspaceAttrs() {
  const attrs = [];
  for (const [entity, fields] of [
    [names.workspaces, ['id', 'name', 'ownerId', 'memberIds', 'appListId']],
    [names.operations, ['id', 'workspaceId', 'authorId', 'body']],
  ]) {
    for (const field of fields)
      attrs.push({
        id: randomUUID(),
        'forward-identity': [randomUUID(), entity, field],
        'value-type': 'blob',
        cardinality: 'one',
        'unique?': field === 'id',
        'index?': field === 'workspaceId',
      });
  }
  attrs.push({
    id: randomUUID(),
    'forward-identity': [randomUUID(), names.operations, 'workspace'],
    'reverse-identity': [randomUUID(), names.workspaces, 'operations'],
    'value-type': 'ref',
    cardinality: 'one',
    'unique?': false,
    'index?': false,
  });
  attrs.push({
    id: randomUUID(),
    'forward-identity': [randomUUID(), names.workspaces, 'groceryList'],
    'reverse-identity': [randomUUID(), 'grocery_lists', 'quantityWorkspace'],
    'value-type': 'ref',
    cardinality: 'one',
    'unique?': true,
    'index?': false,
  });
  return attrs;
}
