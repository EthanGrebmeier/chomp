// Isolated test schema/rules only. Never import this into the application.
import { createHash, randomUUID } from 'node:crypto';

export const TEST_APP = '5df33e29-252b-4e1c-a111-53787beccba3';
export const verifyTarget = (env, flag) => {
  if (
    env.EXPO_PUBLIC_INSTANT_APP_ID !== TEST_APP ||
    !env.INSTANT_APP_ADMIN_TOKEN ||
    flag !== '--test-app'
  )
    throw new Error('Expected --test-app and allowlisted test credentials');
};
export const canonical = value => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
};
export const digest = value =>
  createHash('sha256').update(canonical(value)).digest('hex');

export function makeModel(run) {
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(run))
    throw new Error('Invalid run ID');
  const prefix = `gqc04_${run.replaceAll('-', '')}`;
  const ns = Object.fromEntries(
    ['old', 'new'].map(generation => [
      generation,
      Object.fromEntries(
        [
          'lists',
          'members',
          'rows',
          'sources',
          ...(generation === 'new' ? ['entries'] : []),
        ].map(entity => [entity, `${prefix}_${generation}_${entity}`])
      ),
    ])
  );
  const entities = Object.values(ns).flatMap(Object.values);
  const fields = {
    lists: ['marker', 'name', 'ownerId'],
    members: ['marker', 'userId'],
    rows: [
      'marker',
      'name',
      'unit',
      'notes',
      'category',
      'isChecked',
      'isDeleted',
    ],
    sources: ['marker', 'name', 'quantity', 'unit', 'selected', 'ignored'],
    entries: ['marker', 'quantity', 'unit', 'kind', 'active'],
  };
  const attrs = [];
  const links = [];
  for (const [generation, names] of Object.entries(ns)) {
    for (const [kind, entity] of Object.entries(names)) {
      for (const field of [
        'id',
        ...fields[kind],
        ...(generation === 'old' && kind === 'rows' ? ['quantity'] : []),
      ]) {
        attrs.push({
          id: randomUUID(),
          'forward-identity': [randomUUID(), entity, field],
          'value-type': 'blob',
          cardinality: 'one',
          'unique?': field === 'id',
          'index?': false,
        });
      }
    }
    for (const kind of [
      'members',
      'rows',
      'sources',
      ...(generation === 'new' ? ['entries'] : []),
    ])
      links.push([names[kind], 'list', names.lists, kind]);
    if (generation === 'old')
      links.push([names.rows, 'source', names.sources, 'rows']);
    else {
      links.push([names.entries, 'row', names.rows, 'entries']);
      links.push([names.entries, 'source', names.sources, 'entries']);
    }
  }
  for (const [from, label, to, reverse] of links)
    attrs.push({
      id: randomUUID(),
      'forward-identity': [randomUUID(), from, label],
      'reverse-identity': [randomUUID(), to, reverse],
      'value-type': 'ref',
      cardinality: 'one',
      'unique?': false,
      'index?': false,
    });
  return { run, prefix, ns, entities, attrs, links };
}

export const outsideRules = (rules, entities) =>
  Object.fromEntries(
    Object.entries(rules).filter(([name]) => !entities.includes(name))
  );

export function rulesFor(model, phase) {
  if (!['legacy', 'row-frozen', 'fenced'].includes(phase))
    throw new Error('Unknown phase');
  const rules = {};
  for (const [generation, names] of Object.entries(model.ns)) {
    const member = "auth.id in data.ref('list.members.userId')";
    const listMember = "auth.id in data.ref('members.userId')";
    const owner = 'auth.id == data.ownerId';
    rules[names.lists] = {
      allow: {
        $default: 'false',
        view: `${owner} || ${listMember}`,
        create: 'auth.id != null && auth.id == data.ownerId',
        update: `(${owner} || ${listMember}) && newData.ownerId == data.ownerId`,
        delete: owner,
      },
    };
    rules[names.members] = {
      allow: {
        $default: 'false',
        view: member,
        create:
          generation === 'old'
            ? 'auth.id == data.userId'
            : "auth.id in data.ref('list.ownerId')",
        ...(generation === 'old' ? { update: 'auth.id == data.userId' } : {}),
        delete: "auth.id == data.userId || auth.id in data.ref('list.ownerId')",
      },
    };
    for (const kind of [
      'rows',
      'sources',
      ...(generation === 'new' ? ['entries'] : []),
    ]) {
      const valid =
        kind === 'entries'
          ? `${member} && size(data.ref('row.id')) == 1 && data.ref('row.list.id') == data.ref('list.id') && (size(data.ref('source.id')) == 0 || data.ref('source.list.id') == data.ref('list.id')) && data.quantity >= 0`
          : member;
      rules[names[kind]] = {
        allow: {
          $default: 'false',
          view: member,
          create: valid,
          update: valid,
          delete: member,
        },
      };
    }
    if (generation === 'new' && phase !== 'fenced') {
      for (const entity of Object.values(names))
        rules[entity] = { allow: { $default: 'false' } };
    }
    if (generation === 'old' && phase !== 'legacy') {
      const frozen = phase === 'fenced' ? Object.values(names) : [names.rows];
      for (const entity of frozen)
        rules[entity] = {
          allow: { $default: 'false', view: rules[entity].allow.view },
        };
    }
  }
  return rules;
}

export function allAttrs(schema) {
  return [
    ...Object.values(schema.blobs).flatMap(Object.values),
    ...Object.values(schema.refs),
  ];
}

// Ignore only server-derived inference metadata, not schema/permission semantics.
export const schemaContract = schema =>
  allAttrs(schema)
    .map(attr =>
      Object.fromEntries(
        Object.entries(attr).filter(([key]) => key !== 'inferred-types')
      )
    )
    .sort((a, b) => a.id.localeCompare(b.id));

export function assertIsolatedSchema(schema, model) {
  const expected = new Map(model.attrs.map(attr => [attr.id, attr]));
  for (const attr of allAttrs(schema)) {
    const from = attr['forward-identity'][1];
    const to = attr['reverse-identity']?.[1];
    if (!model.entities.includes(from) && !model.entities.includes(to))
      continue;
    const owned = expected.get(attr.id);
    if (
      !owned ||
      canonical(attr['forward-identity']) !==
        canonical(owned['forward-identity']) ||
      canonical(attr['reverse-identity']) !==
        canonical(owned['reverse-identity']) ||
      attr['on-delete'] ||
      attr['on-delete-reverse']
    )
      throw new Error(
        'Unexpected proof schema/link: preserve for manual recovery'
      );
  }
}
