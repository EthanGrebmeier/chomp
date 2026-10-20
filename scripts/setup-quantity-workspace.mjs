// Installs development quantity namespaces and their list-scope link. Unrelated rules/data are preserved.
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  testApp,
  TEST_APP,
  names,
  workspaceAttrs,
  workspaceRules,
} from './quantity/test-app.mjs';

const { api } = testApp();
const schema = (await api(`/admin/schema?app_id=${TEST_APP}`)).schema;
const originalRules = (await api(`/dash/apps/${TEST_APP}/perms/pull`)).perms;
if (originalRules.attrs?.allow?.$default !== 'false')
  throw new Error('Unknown attribute creation must be denied');
mkdirSync('tmp/quantity', { recursive: true });
writeFileSync(
  `tmp/quantity/setup-${Date.now()}.json`,
  JSON.stringify({ schema, originalRules }),
  { mode: 0o600 }
);
const installed = Object.values(names).every(name => schema.blobs[name]);
if (installed) {
  // Refuse drift instead of installing permissions over a subtly different model.
  for (const expected of workspaceAttrs()) {
    const [, entity, field] = expected['forward-identity'];
    const actual =
      expected['value-type'] === 'ref'
        ? Object.values(schema.refs).find(
            attr =>
              attr['forward-identity'][1] === entity &&
              attr['forward-identity'][2] === field
          )
        : schema.blobs[entity]?.[field];
    if (!actual && ['groceryList', 'appListId', 'serialKey'].includes(field))
      continue;
    if (
      !actual ||
      ['value-type', 'cardinality', 'unique?', 'index?'].some(
        key => actual[key] !== expected[key]
      ) ||
      (expected['reverse-identity'] &&
        JSON.stringify(actual['reverse-identity']?.slice(1)) !==
          JSON.stringify(expected['reverse-identity'].slice(1))) ||
      actual['on-delete'] ||
      actual['on-delete-reverse']
    )
      throw new Error(
        `Unexpected quantity schema at ${entity}.${field}; inspect the backup before continuing`
      );
  }
  const related = Object.values(schema.refs).filter(
    attr =>
      Object.values(names).includes(attr['forward-identity'][1]) ||
      Object.values(names).includes(attr['reverse-identity'][1])
  );
  if (related.length < 1 || related.length > 2)
    throw new Error('Unexpected links into the quantity namespaces');
}
if (!installed) {
  if (Object.values(names).some(name => schema.blobs[name]))
    throw new Error('Partial installation: inspect backup before continuing');
  await api(`/dash/apps/${TEST_APP}/rules`, 'POST', {
    code: {
      ...originalRules,
      ...Object.fromEntries(
        Object.values(names).map(name => [
          name,
          { allow: { $default: 'false' } },
        ])
      ),
    },
  });
  await api('/admin/transact', 'POST', {
    steps: workspaceAttrs().map(attr => ['add-attr', attr]),
  });
}
if (
  installed &&
  !Object.values(schema.refs).some(
    attr =>
      attr['forward-identity'][1] === names.workspaces &&
      attr['forward-identity'][2] === 'groceryList'
  )
) {
  await api('/admin/transact', 'POST', {
    steps: workspaceAttrs()
      .filter(attr => attr['forward-identity'][2] === 'groceryList')
      .map(attr => ['add-attr', attr]),
  });
}
if (installed && !schema.blobs[names.workspaces]?.appListId) {
  await api('/admin/transact', 'POST', {
    steps: workspaceAttrs()
      .filter(attr => attr['forward-identity'][2] === 'appListId')
      .map(attr => ['add-attr', attr]),
  });
}
if (installed && !schema.blobs[names.operations]?.serialKey) {
  await api('/admin/transact', 'POST', {
    steps: workspaceAttrs()
      .filter(attr => attr['forward-identity'][2] === 'serialKey')
      .map(attr => ['add-attr', attr]),
  });
}
{
  const { db } = testApp();
  const existing = await db.query({ [names.workspaces]: { groceryList: {} } });
  const appLists = existing[names.workspaces].filter(
    workspace =>
      !workspace.appListId &&
      (Array.isArray(workspace.groceryList)
        ? workspace.groceryList[0]?.id
        : workspace.groceryList?.id) === workspace.id
  );
  if (appLists.length)
    await db.transact(
      appLists.map(workspace =>
        db.tx[names.workspaces][workspace.id].update({
          appListId: workspace.id,
        })
      )
    );
}
const currentRules = (await api(`/dash/apps/${TEST_APP}/perms/pull`)).perms;
for (const key of Object.keys(originalRules).filter(
  key => !Object.values(names).includes(key)
)) {
  if (JSON.stringify(originalRules[key]) !== JSON.stringify(currentRules[key]))
    throw new Error('Unrelated rules changed; stopping');
}
await api(`/dash/apps/${TEST_APP}/rules`, 'POST', {
  code: { ...currentRules, ...workspaceRules },
});
console.log(
  'Quantity model installed for development app lists and the example workspace. Existing application records and rules preserved.'
);
