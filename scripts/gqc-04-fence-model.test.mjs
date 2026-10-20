import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  TEST_APP,
  verifyTarget,
  makeModel,
  canonical,
  rulesFor,
  outsideRules,
  assertIsolatedSchema,
  schemaContract,
} from './gqc-04-fence-model.mjs';

const run = '12345678-1234-1234-1234-123456789abc';
const model = makeModel(run);
const asSchema = attrs => ({
  blobs: Object.fromEntries(
    model.entities.map(entity => [
      entity,
      Object.fromEntries(
        attrs
          .filter(
            a =>
              a['value-type'] === 'blob' && a['forward-identity'][1] === entity
          )
          .map(a => [a['forward-identity'][2], a])
      ),
    ])
  ),
  refs: Object.fromEntries(
    attrs.filter(a => a['value-type'] === 'ref').map(a => [a.id, a])
  ),
});

test('writes require allowlisted app, token and explicit flag', () => {
  const env = {
    EXPO_PUBLIC_INSTANT_APP_ID: TEST_APP,
    INSTANT_APP_ADMIN_TOKEN: 'test-only',
  };
  assert.doesNotThrow(() => verifyTarget(env, '--test-app'));
  assert.throws(() =>
    verifyTarget({ ...env, EXPO_PUBLIC_INSTANT_APP_ID: 'other' }, '--test-app')
  );
  assert.throws(() =>
    verifyTarget({ ...env, INSTANT_APP_ADMIN_TOKEN: '' }, '--test-app')
  );
  assert.throws(() => verifyTarget(env, undefined));
});

test('run identifier cannot escape the recovery path', () => {
  assert.throws(() => makeModel('../elsewhere'));
});

test('schema has no old/new cross-links, user links or cascades', () => {
  const old = Object.values(model.ns.old);
  const updated = Object.values(model.ns.new);
  for (const [from, , to] of model.links) {
    assert.ok(
      old.includes(from)
        ? old.includes(to)
        : updated.includes(from) && updated.includes(to)
    );
  }
  assert.equal(
    model.attrs.filter(
      a =>
        a['forward-identity'][1] === model.ns.new.rows &&
        a['forward-identity'][2] === 'quantity'
    ).length,
    0
  );
  assert.doesNotThrow(() => assertIsolatedSchema(asSchema(model.attrs), model));
});

test('fence freezes every old entity, not just rows', () => {
  const rules = rulesFor(model, 'fenced');
  for (const entity of Object.values(model.ns.old)) {
    assert.equal(rules[entity].allow.$default, 'false');
    for (const operation of ['create', 'update', 'delete'])
      assert.equal(rules[entity].allow[operation], undefined);
  }
  assert.notEqual(rules[model.ns.new.entries].allow.create, 'false');
  assert.notEqual(rules[model.ns.new.sources].allow.update, 'false');
});

test('negative-control phase freezes rows but retains source writes', () => {
  const rules = rulesFor(model, 'row-frozen');
  assert.equal(rules[model.ns.old.rows].allow.update, undefined);
  assert.ok(rules[model.ns.old.sources].allow.update.includes('auth.id'));
  assert.deepEqual(rules[model.ns.new.entries], {
    allow: { $default: 'false' },
  });
});

test('rules outside proof namespaces are retained exactly', () => {
  const original = {
    attrs: { allow: { $default: 'false' } },
    grocery_items: { bind: ['a', 'b'], allow: { update: 'true' } },
  };
  const merged = { ...original, ...rulesFor(model, 'fenced') };
  assert.deepEqual(outsideRules(merged, model.entities), original);
});

test('canonical comparison retains order-sensitive permission bindings and identities', () => {
  assert.equal(canonical({ b: 2, a: 1 }), canonical({ a: 1, b: 2 }));
  assert.notEqual(canonical(['a', 'b']), canonical(['b', 'a']));
});

test('cleanup refuses foreign links and unexpected schema', () => {
  const external = {
    id: 'external',
    'value-type': 'ref',
    'forward-identity': ['f', 'grocery_items', 'unsafe'],
    'reverse-identity': ['r', model.ns.new.rows, 'foreign'],
  };
  assert.throws(() =>
    assertIsolatedSchema(asSchema([...model.attrs, external]), model)
  );
  const withCascade = model.attrs.map((a, index) =>
    index === 0 ? { ...a, 'on-delete': 'cascade' } : a
  );
  assert.throws(() => assertIsolatedSchema(asSchema(withCascade), model));
});

test('schema comparison ignores derived inference but detects semantic changes', () => {
  const schema = asSchema(model.attrs);
  const inferred = asSchema(
    model.attrs.map(a => ({ ...a, 'inferred-types': ['string'] }))
  );
  assert.deepEqual(schemaContract(schema), schemaContract(inferred));
  const changed = asSchema(
    model.attrs.map((a, index) =>
      index === 0 ? { ...a, 'unique?': false } : a
    )
  );
  assert.notDeepEqual(schemaContract(schema), schemaContract(changed));
});
