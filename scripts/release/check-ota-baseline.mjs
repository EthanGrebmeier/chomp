import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const target = JSON.parse(readFileSync('release-target.json', 'utf8'));
const baselines = {
  '1.0.5': 'ota/1.0.5/2026-10-21-settings-cleanup',
  '1.0.6': 'ota/1.0.6/2026-10-21-settings-cleanup',
  '1.0.7': 'runtime/1.0.7/build-62-ota-baseline',
};
const baseline = baselines[target.version];
if (target.kind !== 'ota' || !baseline) {
  throw Error('No approved OTA baseline for this runtime');
}
// Freeze the resolved dependency graph, native patches, and build configuration.
// JavaScript-only fixes are backported; native changes require a new binary.
execFileSync(
  'git',
  [
    'diff',
    '--exit-code',
    baseline,
    'HEAD',
    '--',
    'app.json',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'patches',
    'ios',
    'android',
    'release-target.json',
  ],
  { stdio: 'inherit' }
);
console.log(`Native inputs match ${baseline}`);
