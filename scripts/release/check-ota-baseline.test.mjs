import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const script = fileURLToPath(
  new URL('./check-ota-baseline.mjs', import.meta.url)
);
test('OTA guard accepts JS backports and rejects changed native dependencies', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'chomp-ota-guard-'));
  const git = (...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });
  const check = () =>
    spawnSync(process.execPath, [script], { cwd, encoding: 'utf8' });
  try {
    git('init');
    git('config', 'user.name', 'Release test');
    git('config', 'user.email', 'release-test@example.invalid');
    writeFileSync(
      join(cwd, 'release-target.json'),
      JSON.stringify({ version: '1.0.5', kind: 'ota' })
    );
    writeFileSync(
      join(cwd, 'pnpm-lock.yaml'),
      'approved native dependencies\n'
    );
    git('add', '.');
    git('-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'baseline');
    git('tag', 'ota/1.0.5/2026-10-21-settings-cleanup');
    assert.equal(check().status, 0);
    writeFileSync(join(cwd, 'screen.tsx'), 'export const label = "Fixed";\n');
    git('add', '.');
    git('-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'JS fix');
    assert.equal(check().status, 0);
    writeFileSync(
      join(cwd, 'pnpm-lock.yaml'),
      'different native dependencies\n'
    );
    git('add', '.');
    git(
      '-c',
      'core.hooksPath=/dev/null',
      'commit',
      '-m',
      'incompatible native change'
    );
    assert.notEqual(check().status, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
