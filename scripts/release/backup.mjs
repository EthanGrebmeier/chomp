import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const SOURCE_APP = 'b9d047cb-bb6f-4b36-95af-a6a1d045846b';
export const TARGET_APP = '5df33e29-252b-4e1c-a111-53787beccba3';
export const canonical = value =>
  JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b))
        )
      : v
  );
export const digest = value =>
  createHash('sha256').update(canonical(value)).digest('hex');
export function linksFor(schema, namespace) {
  return Object.values(schema.links).flatMap(({ forward, reverse }) => [
    ...(forward.on === namespace ? [{ ...forward, target: reverse.on }] : []),
    ...(reverse.on === namespace ? [{ ...reverse, target: forward.on }] : []),
  ]);
}
export function readBackup(file) {
  const read = name =>
    execFileSync('unzip', ['-p', file, name], {
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
    });
  execFileSync('unzip', ['-tqq', file], { stdio: 'pipe' });
  const config = JSON.parse(read('config.json'));
  if (config.appId !== SOURCE_APP)
    throw Error('Expected the verified production backup');
  const tables = {};
  for (const [name, count] of Object.entries(config.counts)) {
    if (!/^[\w$-]+$/.test(name)) throw Error('Invalid namespace');
    tables[name] = count
      ? read(`entities/${name}.jsonl`)
          .trim()
          .split('\n')
          .map(line => JSON.parse(line).entity)
      : [];
    if (
      tables[name].length !== count ||
      new Set(tables[name].map(x => x.id)).size !== count
    )
      throw Error(`Invalid count/identity: ${name}`);
  }
  for (const [name, rows] of Object.entries(tables)) {
    for (const link of linksFor(config.schema, name)) {
      const ids = new Set((tables[link.target] ?? []).map(x => x.id));
      for (const row of rows)
        for (const id of [row[link.label] ?? []].flat()) {
          if (!ids.has(id))
            throw Error(`Missing linked identity: ${name}.${link.label}`);
        }
    }
  }
  // ZIP records may contain only one direction of a link. Reconstruct both
  // directions before comparing them with an SDK query, which returns both.
  for (const { forward, reverse } of Object.values(config.schema.links)) {
    const left = new Map((tables[forward.on] ?? []).map(row => [row.id, row]));
    const right = new Map((tables[reverse.on] ?? []).map(row => [row.id, row]));
    const edges = new Map();
    for (const row of left.values())
      for (const target of [row[forward.label] ?? []].flat())
        edges.set(`${row.id}:${target}`, [row.id, target]);
    for (const row of right.values())
      for (const target of [row[reverse.label] ?? []].flat())
        edges.set(`${target}:${row.id}`, [target, row.id]);
    for (const [rows, side] of [
      [left, forward],
      [right, reverse],
    ])
      for (const row of rows.values())
        row[side.label] = side.has === 'many' ? [] : null;
    const add = (row, side, id) => {
      if (side.has === 'many') row[side.label].push(id);
      else {
        if (row[side.label] && row[side.label] !== id)
          throw Error('Conflicting has-one links');
        row[side.label] = id;
      }
    };
    for (const [a, b] of edges.values()) {
      add(left.get(a), forward, b);
      add(right.get(b), reverse, a);
    }
  }
  return {
    config,
    tables,
    sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
  };
}
export function backupQuery(schema, namespaces) {
  return Object.fromEntries(
    namespaces.map(name => [
      name,
      Object.fromEntries(linksFor(schema, name).map(link => [link.label, {}])),
    ])
  );
}
export function flattenQuery(schema, data) {
  return Object.fromEntries(
    Object.entries(data).map(([name, rows]) => [
      name,
      rows.map(row => {
        const value = { ...row };
        for (const link of linksFor(schema, name)) {
          const nested = value[link.label];
          value[link.label] =
            link.has === 'many'
              ? (nested ?? []).map(x => x.id).sort()
              : ((Array.isArray(nested) ? nested[0]?.id : nested?.id) ?? null);
        }
        return value;
      }),
    ])
  );
}
export function normalizedRow(schema, name, row) {
  const value = { ...row };
  for (const link of linksFor(schema, name))
    value[link.label] =
      link.has === 'many'
        ? [...(value[link.label] ?? [])].sort()
        : (value[link.label] ?? null);
  return value;
}
