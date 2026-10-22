/**
 * Detects drift between the local Instant config (`instant.schema.ts`,
 * `instant.perms.ts`) and what is deployed to the Instant app.
 *
 * `pnpm tsc` only sees the local files, so forgetting `pnpm push-schema` or
 * `pnpm push-perms` goes unnoticed until writes start failing at runtime
 * (e.g. a required attribute removed locally but still required remotely).
 *
 * The deployed config is pulled with `instant-cli` into a scratch directory,
 * both versions are loaded, and they are compared structurally (entities,
 * attributes, links and permission rules) so formatting and ordering never
 * show up as differences.
 *
 * Requirements (read from the env file, `.env.local` by default):
 *   EXPO_PUBLIC_INSTANT_APP_ID  Instant app id to compare against
 *   INSTANT_APP_ADMIN_TOKEN     Admin token for that app
 *
 * Usage:
 *   pnpm check-instant                         # compare against .env.local
 *   pnpm check-instant --env .env.dev.local    # compare against another app
 *
 * Exits with status 1 when any drift is found.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
// Must live outside node_modules: Node only strips types from files there.
const REMOTE_DIR = path.join('tmp', 'instant-drift');

const envFlagIndex = process.argv.indexOf('--env');
const envFile =
  envFlagIndex === -1 ? '.env.local' : process.argv[envFlagIndex + 1];

if (!envFile) {
  console.error('Missing value for --env.');
  process.exit(1);
}

// The config files import from the React Native SDK, which cannot load in
// Node. The admin SDK exposes the same schema builder.
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier === '@instantdb/react-native' ? '@instantdb/admin' : specifier,
      context
    );
  },
});

async function loadDefault(file) {
  const module = await import(pathToFileURL(path.resolve(ROOT, file)).href);
  return module.default;
}

function pullRemoteConfig() {
  rmSync(path.join(ROOT, REMOTE_DIR), { recursive: true, force: true });
  mkdirSync(path.join(ROOT, REMOTE_DIR), { recursive: true });

  execFileSync(
    'npx',
    ['--yes', 'instant-cli@latest', 'pull', 'all', '--env', envFile, '--yes'],
    {
      cwd: ROOT,
      stdio: ['ignore', 'ignore', 'inherit'],
      env: {
        ...process.env,
        INSTANT_SCHEMA_FILE_PATH: path.join(REMOTE_DIR, 'instant.schema.ts'),
        INSTANT_PERMS_FILE_PATH: path.join(REMOTE_DIR, 'instant.perms.ts'),
      },
    }
  );
}

/** Instant-managed entities (`$files`, `$users`, ...) carry extra attrs. */
const isSystemEntity = name => name.startsWith('$');

function describeAttr(attr) {
  return {
    valueType: attr.valueType,
    required: attr.required,
    unique: Boolean(attr.config?.unique),
    indexed: Boolean(attr.config?.indexed),
  };
}

function describeLinks(schema) {
  const links = new Map();
  for (const { forward, reverse } of Object.values(schema.links)) {
    links.set(`${forward.on}.${forward.label}`, {
      isSystem: isSystemEntity(forward.on) && isSystemEntity(reverse.on),
      forward: `${forward.on}.${forward.label} (${forward.has})`,
      reverse: `${reverse.on}.${reverse.label} (${reverse.has})`,
      onDelete: forward.onDelete ?? reverse.onDelete ?? null,
    });
  }
  return links;
}

/** JSON with sorted keys so key order never counts as a difference. */
function canonical(value) {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))
        )
      : v
  );
}

function diffFields(label, local, remote, problems) {
  for (const field of Object.keys(local)) {
    if (canonical(local[field]) !== canonical(remote[field])) {
      problems.push(
        `${label}: ${field} is ${canonical(local[field])} locally but ` +
          `${canonical(remote[field])} remotely`
      );
    }
  }
}

function diffSchema(local, remote) {
  const problems = [];
  const entityNames = new Set([
    ...Object.keys(local.entities),
    ...Object.keys(remote.entities),
  ]);

  for (const name of [...entityNames].sort()) {
    const localEntity = local.entities[name];
    const remoteEntity = remote.entities[name];

    if (!remoteEntity) {
      problems.push(`entity ${name}: missing remotely`);
      continue;
    }
    if (!localEntity) {
      if (!isSystemEntity(name)) {
        problems.push(`entity ${name}: missing locally`);
      }
      continue;
    }

    const attrNames = new Set([
      ...Object.keys(localEntity.attrs),
      ...Object.keys(remoteEntity.attrs),
    ]);
    for (const attrName of [...attrNames].sort()) {
      const label = `attr ${name}.${attrName}`;
      const localAttr = localEntity.attrs[attrName];
      const remoteAttr = remoteEntity.attrs[attrName];

      if (!remoteAttr) {
        problems.push(`${label}: missing remotely`);
      } else if (!localAttr) {
        if (!isSystemEntity(name)) {
          const required = remoteAttr.required ? ' (required!)' : '';
          problems.push(`${label}: missing locally${required}`);
        }
      } else {
        diffFields(
          label,
          describeAttr(localAttr),
          describeAttr(remoteAttr),
          problems
        );
      }
    }
  }

  const localLinks = describeLinks(local);
  const remoteLinks = describeLinks(remote);
  const linkKeys = new Set([...localLinks.keys(), ...remoteLinks.keys()]);
  for (const key of [...linkKeys].sort()) {
    const label = `link ${key}`;
    if (!remoteLinks.has(key)) {
      problems.push(`${label}: missing remotely`);
    } else if (!localLinks.has(key)) {
      if (!remoteLinks.get(key).isSystem) {
        problems.push(`${label}: missing locally`);
      }
    } else {
      diffFields(label, localLinks.get(key), remoteLinks.get(key), problems);
    }
  }

  return problems;
}

function diffPerms(local, remote) {
  const problems = [];
  const namespaces = new Set([...Object.keys(local), ...Object.keys(remote)]);
  for (const name of [...namespaces].sort()) {
    if (!(name in remote)) {
      problems.push(`perms ${name}: missing remotely`);
    } else if (!(name in local)) {
      problems.push(`perms ${name}: missing locally`);
    } else if (canonical(local[name]) !== canonical(remote[name])) {
      problems.push(`perms ${name}: rules differ`);
    }
  }
  return problems;
}

try {
  pullRemoteConfig();

  const problems = [
    ...diffSchema(
      await loadDefault('instant.schema.ts'),
      await loadDefault(path.join(REMOTE_DIR, 'instant.schema.ts'))
    ),
    ...diffPerms(
      await loadDefault('instant.perms.ts'),
      await loadDefault(path.join(REMOTE_DIR, 'instant.perms.ts'))
    ),
  ];

  if (problems.length === 0) {
    console.log('✅ Local Instant schema and perms match the deployed app.');
  } else {
    console.error(
      `❌ Found ${problems.length} difference(s) between local and deployed ` +
        'Instant config:\n'
    );
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      '\nRun `pnpm push-schema` / `pnpm push-perms` to deploy local changes, ' +
        'or update the local files to match production.'
    );
    process.exitCode = 1;
  }
} finally {
  rmSync(path.join(ROOT, REMOTE_DIR), { recursive: true, force: true });
}
