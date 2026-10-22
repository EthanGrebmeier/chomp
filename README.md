<p align="center">
  <img src="assets/images/icon.png" alt="Chomp app icon" width="96" height="96" />
</p>

<h1 align="center">Chomp</h1>

<p align="center">
  A shared grocery list, recipe box and meal planner for iOS and Android.
</p>

---

## Features

- **Shared grocery lists**: real-time lists you can share with a join code or
  link (`chompgrocery.com/join-list/<code>`). Group and sort items by
  category, store or recipe, and use bulk selection to move, re-categorize or
  delete many items at once.
- **Saved items**: a personal catalog of things you buy often, plus
  frequent-item suggestions while adding to a list.
- **Recipes**: create recipes by hand or import one from a URL. Send
  ingredients to a grocery list and share recipes with a link.
- **Meal planner**: calendar and day-list views of planned meals. Planned
  meals stay in sync with the linked grocery list.
- **Stores and categories**: customizable stores and categories for
  organizing items.
- **Accounts**: sign in with Apple, Google or an email link, or continue as a
  guest.

The shared product vocabulary (bulk selection rules, meal plan views, ...) is
in [`CONTEXT.md`](CONTEXT.md).

## Tech stack

| Concern         | Choice                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| App framework   | [Expo](https://expo.dev) SDK 57, React Native 0.86, React 19 with the React Compiler                 |
| Routing         | [Expo Router](https://docs.expo.dev/router/introduction) (file-based, typed routes)                  |
| Synced data     | [InstantDB](https://instantdb.com) (real-time, offline-capable)                                      |
| On-device data  | SQLite via `expo-sqlite` + [Drizzle ORM](https://orm.drizzle.team) (app settings, local saved items) |
| Auth            | [Clerk](https://clerk.com), bridged into Instant auth                                                |
| Styling         | [NativeWind](https://www.nativewind.dev) (Tailwind CSS v3) and `@rn-primitives` components           |
| Server state    | TanStack Query (calls to the Chomp API: recipe parsing, account deletion)                            |
| Forms           | TanStack Form                                                                                        |
| Builds/releases | [EAS Build](https://docs.expo.dev/build/introduction) and EAS Update (OTA)                           |
| Tests           | [Vitest](https://vitest.dev)                                                                         |

## Getting started

### Prerequisites

- Node.js 22.18+ and [pnpm](https://pnpm.io) 11 (`corepack enable` picks up the
  pinned version)
- Xcode (iOS) and/or Android Studio (Android). The app uses native modules,
  so it runs in a [development build](https://docs.expo.dev/develop/development-builds/introduction/),
  not Expo Go.
- Access to a Clerk app, an Instant app and the Chomp API

### Setup

```bash
pnpm install                  # also enables the git hooks in .githooks/
cp .env.example .env.local    # then fill in the values
pnpm ios                      # or: pnpm android
```

`.env.example` lists every variable the app and scripts read. Add any new
variable there too.

`pnpm ios` / `pnpm android` generate the native projects (`ios/` and
`android/` are gitignored), build them and start Metro. Once a dev build is
installed, `pnpm start` is enough for JS-only changes.

## Scripts

| Command                  | What it does                                                     |
| ------------------------ | ---------------------------------------------------------------- |
| `pnpm start`             | Start the Metro dev server                                       |
| `pnpm ios` / `android`   | Build and run a development build                                |
| `pnpm test`              | Run the Vitest suite (watch mode)                                |
| `pnpm lint`              | ESLint via `expo lint` (`pnpm lint:fix` to autofix)              |
| `pnpm tsc`               | Type-check                                                       |
| `pnpm format`            | Format everything with Prettier (`format:check` to verify)       |
| `pnpm push-schema`       | Deploy `instant.schema.ts` to Instant                            |
| `pnpm push-perms`        | Deploy `instant.perms.ts` to Instant                             |
| `pnpm check-instant`     | Fail if local and deployed Instant config differ                 |
| `pnpm sync:theme-colors` | Regenerate `lib/theme.ts` from the CSS variables in `global.css` |

Before you push, run `pnpm lint && pnpm tsc` (and `pnpm test`). A pre-commit
hook rejects staged files that aren't formatted with Prettier.

## Project structure

```
app/            Expo Router routes (screens only; logic lives in features/)
  (auth)/       Welcome, sign-in and email-link flows
  (tabs)/       Main tab navigator (grocery lists)
features/       Feature modules: grocery-list, recipes, meal-planner, ...
  <feature>/
    components/ UI for the feature
    hooks/      React hooks
    instant/    InstantDB queries and transactions
    api/        Chomp API calls
    __tests__/  Vitest tests
components/     Shared UI (components/ui/ holds the design-system primitives)
lib/            Cross-cutting code: Instant client, Clerk helpers, navigation, theme
providers/      App-level providers (SQLite migrations, React Query)
db/             Drizzle schema and client for on-device SQLite
drizzle/        Generated SQLite migrations (do not edit by hand)
instant.*.ts    InstantDB schema and permissions
scripts/        Maintenance scripts (data migrations, drift checks, tooling)
docs/, plans/   Specs, PRDs and implementation notes
patches/        pnpm patches for third-party packages
```

## Data

### InstantDB

`instant.schema.ts` and `instant.perms.ts` hold the source of truth for synced
data, but you deploy them by hand, and `pnpm tsc` only checks the local
files. After changing either file:

```bash
pnpm push-schema   # and/or pnpm push-perms
pnpm check-instant # fails if local and deployed config differ
```

`pnpm check-instant` pulls the deployed config and compares entities,
attributes, links and permission rules structurally. Pass `--env <file>` to
check a different app.

### Data migrations against a dev Instant app

The former quantity development app (`5df33e29-252b-4e1c-a111-53787beccba3`)
is now production. Verify the app ID before any admin command. Keep production
credentials in `.env.production.local` and use a separate app for development.
Quantity SDK tests use `.env.test.local` and explicitly reject both current and
former production apps; see [Quantity model](features/quantity/README.md).
Validate admin-SDK
migrations (`scripts/*.mjs`) on a throwaway app before running them for real:

```bash
# 1. Create a temporary app (auto-deletes after ~24h); prints an app id and
#    admin token
npx instant-cli@latest init-without-files --temp --title chomp-dev

# 2. Put them in .env.dev.local (gitignored)
#    EXPO_PUBLIC_INSTANT_APP_ID=<app id>
#    INSTANT_APP_ADMIN_TOKEN=<admin token>

# 3. Deploy the current schema and perms to it
pnpm push-schema --env .env.dev.local --yes
pnpm push-perms --env .env.dev.local --yes

# 4. Seed data, then run the migration against it
node --env-file=.env.dev.local scripts/<migration>.mjs --dry-run
node --env-file=.env.dev.local scripts/<migration>.mjs
```

Once the dev run looks right and a recoverable backup is verified, dry-run and
then run against the explicitly verified production environment file.

### On-device SQLite

Edit `db/schema.ts`, then generate a migration:

```bash
pnpm drizzle-kit generate
```

`providers/migration-provider.tsx` applies pending migrations at startup.

## Releasing

Builds use the EAS profiles in [`eas.json`](eas.json). Each profile publishes
to the EAS Update channel with the same name:

```bash
eas build --profile development   # internal dev client
eas build --profile preview       # internal testing build
eas build --profile production    # store build (build number auto-increments)
eas submit --profile production

eas update --channel production   # ship a JS-only OTA update
```

The runtime version follows the app version (`app.json`), so a native change
needs a version bump and a new build. On launch the app checks for an OTA
update for up to 5 seconds before showing content
(`lib/use-startup-eas-update.ts`).

## Contributing notes

- Follow the conventions in [`AGENTS.md`](AGENTS.md).
- Record tooling or documentation friction with `pnpx frog log`
  (`pnpx frog list` shows what's already known).
- Privacy policy: [`docs/privacy-policy.md`](docs/privacy-policy.md).

Release branches, backports, and manual OTA publishing are documented in
[Release maintenance](docs/releases.md).
