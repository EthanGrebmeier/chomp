import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = name => JSON.parse(readFileSync(name, 'utf8'));
const lane = read('release-target.json');
const app = read('app.json');
const pkg = read('package.json');
const hash = value =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
if (app.expo.version !== lane.version)
  throw Error('Release version does not match its lane');
if (hash(app) !== lane.appConfigSha256)
  throw Error('Native app configuration changed after release preparation');
for (const [name, version] of Object.entries(lane.baselineDependencies))
  if (pkg.dependencies[name] !== version)
    throw Error(`Baseline dependency changed: ${name}`);
if (hash(pkg.reanimated ?? null) !== lane.reanimatedSha256)
  throw Error('Reanimated build flags do not match this binary lane');
if (
  process.env.EXPO_PUBLIC_INSTANT_APP_ID !==
  '5df33e29-252b-4e1c-a111-53787beccba3'
)
  throw Error(
    'Candidate must explicitly use the approved quantity destination'
  );
console.log(
  `Validated ${lane.version} ${lane.kind} candidate; publication remains a separate action.`
);
