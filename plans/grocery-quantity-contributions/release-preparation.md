# Quantity release preparation

Inspected October 21, 2026, from `exploration/grocery-quantity-rethink` at
`ab1eeed`. This records backup and release discovery; no OTA, store build,
production schema, permissions, or data mutation has been published.

## Backup secured locally

Production app ID, verified against the EAS **production** environment:
`b9d047cb-bb6f-4b36-95af-a6a1d045846b`.

`.env.local` currently targets the isolated quantity app
`5df33e29-252b-4e1c-a111-53787beccba3`. Its admin token cannot access production.
The existing Instant CLI account login successfully downloaded the production
backup after clearing the test admin-token environment overrides.

- Local archive: `backups/production/2026-10-21/instant-backup.zip`.
- Verification manifest: `backups/production/2026-10-21/verification.json`.
- Backup ID: `6b00bf50-b66d-444c-9e2b-417b850e0364`.
- Snapshot: October 20, 2026, 8:00 p.m. Pacific (`2026-10-21T03:00:00Z`).
- SHA-256: `383620635e76b0147ea451e0f119aeb6b09c5c9249076b58ddbfcc094c0161e0`.
- Verified ZIP CRC, JSON parsing, production app identity, unique row IDs,
  every namespace count against `config.json`, and 7,925 link references
  with no missing targets.
- 17 namespaces, including 117 lists, 2,114 grocery items, 51 recipes,
  145 saved items, and auth records. No stored file blobs in this snapshot.
- Archive includes schema and permission rules. Directory permissions are
  owner-only; archive and manifest are mode 600; `/backups/` is gitignored.

Download a fresh available snapshot using an explicit production app ID:

```sh
INSTANT_APP_ADMIN_TOKEN='' INSTANT_ADMIN_TOKEN='' npx --yes instant-cli@latest backup download --latest --app b9d047cb-bb6f-4b36-95af-a6a1d045846b --out backups/production/<new-directory>/instant-backup.zip --yes
```

Create the private output directory first. The empty token variables select the
existing CLI account login instead of the test app token; do not alter
`.env.local` to perform a download.

This is a nightly snapshot, **not a cutover snapshot or a rehearsed restore**.
[Instant's documented ZIP restore](https://www.instantdb.com/docs/backups)
targets a self-hosted instance. Do not assume it can be uploaded back into the
hosted production app. #53 still needs a verified hosted-app recovery path
(or an explicitly selected alternative) and an isolated restore rehearsal.
Never overwrite live data to test recovery. Before cutover, pause writes and
capture/verify the final state; this earlier snapshot is for initial rehearsal.

## Release lanes and confirmed bases

Evidence: [sanitized EAS build inventory](evidence/release-build-inventory.json).
All inspected finished iOS builds use channel `production`. That channel points
to EAS branch `production`; Git branch names do not route OTA traffic.

| Lane                        | Native base                                                                                     | Runtime | Disposition                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| September App Store release | Build 56, `41e07296a65908d848b9abeccefb82c4a72f2e31`, created September 29 at 1:48 p.m. Pacific | `1.0.6` | Owner confirmed October 21: App Store version 1.0.6 was build 56.                                               |
| August App Store release    | Build 50, `18dbad75cff902b3fefe99fc20343dd159aa9cdf`, created August 4                          | `1.0.5` | Owner confirmed October 21: App Store version 1.0.5 was build 50; this resolves the earlier “1.1” label.        |
| TestFlight only             | Build 59, `5cc2ca4343126152b5e3e61c9aa1c46299666111`, October 13                                | `1.0.7` | Not released, per owner. Prepare a replacement native build on this version with the intended Reanimated flags. |

Suggested Git lane names for the confirmed release builds:
`codex/quantity-ota-1.0.6`, `codex/quantity-ota-1.0.5`, and
`codex/quantity-native-1.0.7`. These are planned names, not created branches.

### September OTA

`41e0729` → `ab1eeed` has identical `app.json`, `pnpm-lock.yaml`,
`pnpm-workspace.yaml`, and native patches. `package.json` changes are scripts
only. This is a strong candidate for a JS-only update; export and actual-build
tests are still required. Keep the native dependency versions and runtime
`1.0.6` fixed. Do not bring the TestFlight Reanimated flags into this lane.

The latest observed production OTA was group
`c994c9c4-b1d6-4975-a89f-b44a6caa9303`, commit `800762c`, runtime `1.0.6`,
published October 13. Preserve this as pre-cutover update history, not as a safe
post-migration rollback: its data model is old.

### August OTA

Use the confirmed August build commit as the native baseline, carrying forward
the feature code while retaining its dependency lock, native patches, app
configuration, and runtime. Simply changing today's version to `1.0.5` is unsafe.

| Native boundary        | Change                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bb211a3`, August 11   | Removed native dependencies/plugins including image picker and datetime picker; changed embedded font configuration. Later code must not assume those newly embedded fonts exist in the August binary.             |
| `6441947`, September 5 | Expo 56 → 57, RN 0.85.3 → 0.86.3, Reanimated 4.3.1 → 4.5.1, Worklets 0.8.3 → 0.10.1; Expo module upgrades, keyboard-controller/pager/screens/gesture-handler changes, SQLite patch revision, DOM WebView addition. |
| `45391ce`, September 7 | FlashList dependency changed; preserve the August version for its backport.                                                                                                                                        |
| `09581b4`, September 8 | Added Reanimated DnD; current meal planner imports it. Assess its compatibility with August's Reanimated/Worklets instead of blindly copying the lockfile.                                                         |
| `5dadae5`, October 13  | Added `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` and `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` native build flags. Followed by `5cc2ca4` version bump to 1.0.7.                                                             |

**Runtime collision:** build 52 is Expo 57 but uses runtime `1.0.5`, the same
runtime/channel as August's Expo 56 builds. Confirm it was not publicly released;
TestFlight users of it can also receive production-channel updates. Runtime
matching alone cannot distinguish these binaries. Recorded fingerprints differ,
but the app uses the `appVersion` policy, not fingerprint routing.

### Older clients

Observed older runtime families are `1.0.0`, `1.0.1`, `1.0.2`, `1.0.3`, and
`1.0.4`. Build records alone do not establish which were publicly released.
Runtime `1.0.4` also spans Expo 55 and 56, so it cannot be treated as one native
baseline. The first 50 EAS records are preserved; inspect further history if
needed before declaring every historical binary covered.

Prepare a minimal update-required entrypoint for each confirmed older native
family, using its original dependency lock. Mount the gate before authentication,
database providers, and normal navigation; use a verified Chomp App Store URL.
Avoid importing the modern app or quantity code into that small bundle. A bundle
compiled for one SDK cannot be assumed compatible with another sharing its
runtime. Resolve collisions before publishing. An OTA can require the user to
open the store, but cannot install an App Store update itself.

OTA delivery is not an enforceable write boundary: offline clients may not fetch
it and the existing startup hook deliberately fails open. #53 must reject old
writers and their queued edits server-side even if the prompt is never seen.

## Issue order and release gates

1. **#53 backup/recovery:** local nightly backup is secured. Next prepare the
   rerunnable migration, preserve row IDs/totals/units/history/links, rehearse
   migration and recovery on an isolated copy, and confirm the hosted recovery
   procedure. Production admin credentials must be provisioned separately from
   the test credentials before admin-SDK migration execution.
2. **#53 old-client fence:** implement and test with actual old/new binaries,
   shared access, lifecycle operations, and edits queued before the fence.
   Update prompts supplement this; they do not replace it.
3. **#51 QA:** test the September OTA, August backport, and replacement native
   build separately, including offline process death, saved-item retries,
   two-client edits/revocation, and realistic history size. Run Android checks
   if Android is a release target; this inventory covers iOS only.
4. **Production configuration:** `features/quantity/config.ts` still requires
   `__DEV__` and the test app ID. Publishing the current branch unchanged would
   keep quantities disabled. Enable the production path only with the verified
   schema, migration, and permissions; a release build on the test app must be
   possible for pre-production validation.
5. **Cutover:** ready clients, old-client gates, fresh backup, write pause,
   migration/fence, ordinary/shared-list audit, then reopen writes. Record the
   recovery owner and go/no-go. If validation fails, keep writes paused and
   repair/restore; do not republish an incompatible pre-migration client.

#40 stays open until rollout completes. Other open issues include older meal-plan
tickets and friction reports that may already be addressed on this branch;
their titles alone are not evidence for closure. Prioritize #51/#53 and resolve
concrete release failures rather than bundling an unrelated backlog cleanup.

Reference: [Expo runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/)
and [update routing](https://docs.expo.dev/eas-update/how-it-works/).
