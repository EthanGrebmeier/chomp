import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { readBackup, flattenQuery, SOURCE_APP } from './backup.mjs';
const schema = {
  entities: { lists: {}, items: {} },
  links: {
    itemList: {
      forward: { on: 'items', label: 'list', has: 'one' },
      reverse: { on: 'lists', label: 'items', has: 'many' },
    },
  },
};
function fixture(run, { dangling = false, wrongCount = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'chomp-backup-test-'));
  try {
    mkdirSync(join(dir, 'entities'));
    writeFileSync(
      join(dir, 'config.json'),
      JSON.stringify({
        appId: SOURCE_APP,
        schema,
        counts: { lists: 1, items: wrongCount ? 2 : 1 },
      })
    );
    writeFileSync(
      join(dir, 'entities/lists.jsonl'),
      JSON.stringify({ entity: { id: 'list' } }) + '\n'
    );
    writeFileSync(
      join(dir, 'entities/items.jsonl'),
      JSON.stringify({
        entity: { id: 'item', list: dangling ? 'missing' : 'list' },
      }) + '\n'
    );
    const archive = join(dir, 'backup.zip');
    execFileSync('zip', ['-qr', archive, 'config.json', 'entities'], {
      cwd: dir,
    });
    run(archive);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
test('reconstructs inverse links omitted from ZIP rows', () =>
  fixture(file => {
    const b = readBackup(file);
    assert.deepEqual(b.tables.lists[0].items, ['item']);
    assert.equal(b.tables.items[0].list, 'list');
  }));
test('handles schemaless arrays for has-one SDK results', () => {
  const result = flattenQuery(schema, {
    items: [{ id: 'item', list: [{ id: 'list' }] }],
  });
  assert.equal(result.items[0].list, 'list');
});
test('rejects incomplete backup counts', () =>
  fixture(file => assert.throws(() => readBackup(file), /count/), {
    wrongCount: true,
  }));
test('rejects dangling links before importing anything', () =>
  fixture(file => assert.throws(() => readBackup(file), /Missing linked/), {
    dangling: true,
  }));
