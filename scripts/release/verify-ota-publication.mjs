import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const updates = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const target = JSON.parse(readFileSync('release-target.json', 'utf8'));
const app = JSON.parse(readFileSync('app.json', 'utf8'));
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
if (!Array.isArray(updates) || updates.length !== 1)
  throw Error('Expected one iOS update');
const [update] = updates;
if (
  update.platform !== 'ios' ||
  update.runtimeVersion !== target.version ||
  update.gitCommitHash !== commit ||
  update.branch !== 'production'
) {
  throw Error('Publication does not match the reviewed release');
}
const response = await fetch(app.expo.updates.url, {
  headers: {
    'expo-platform': 'ios',
    'expo-runtime-version': target.version,
    'expo-channel-name': 'production',
    'expo-protocol-version': '1',
    accept: 'multipart/mixed',
  },
});
if (!response.ok || !(await response.text()).includes(update.id)) {
  throw Error(
    'Published update is not yet being served; inspect EAS before retrying publication'
  );
}
console.log(
  `Verified production delivery of ${update.id} for ${target.version}`
);
