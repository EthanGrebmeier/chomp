# Release maintenance

`main` contains ongoing development and the next native release. Maintain OTA fixes
on `release/1.0.5` (App Store build 50) and `release/1.0.6` (build 56). `release/1.0.7` maintains TestFlight build 62, rooted at
`9475c74a6ebc3f29e3578e58208c837960e55725`. It is not yet a supported App Store
release. Its OTA baseline is tagged `runtime/1.0.7/build-62-ota-baseline`; this
tag records the frozen native inputs and OTA lane configuration, not a published
update. Keep 1.0.5 and 1.0.6 supported until 1.0.7 ships and the upgrade window ends.

## Backport a fix

1. Merge the fix into `main` through a pull request.
2. Create a short-lived branch from the affected `release/*` branch.
3. Run `git cherry-pick -x <fix-commit>` and resolve differences for that runtime.
4. Open a PR targeting that release branch. Required validation runs lint,
   TypeScript, unit tests, release configuration checks, and frozen native input checks.
5. Test with a binary for that runtime before publishing.

Do not merge main wholesale into a maintenance branch. Native inputs, including the
lockfile and native patches, are frozen against the last validated OTA baseline.
A native dependency change requires a new binary and a distinct runtime version;
never reuse a runtime across incompatible native builds, including TestFlight.

## Publish an OTA

In GitHub Actions, select **Publish OTA**, run the workflow from **main**, select the
maintenance branch, and provide its full reviewed head SHA and a release message.
The workflow refuses a different head, validates and exports that exact commit,
and publishes only iOS to the existing EAS production channel. It uses repository
`EXPO_PUBLIC_*` variables and explicitly pins the approved quantity database.
EAS environment values do not rebundle the pre-exported artifact.

The workflow requires the repository secret `EXPO_TOKEN`. This token should have
only the Expo access necessary for this project. Never commit credentials or
production backups. The `production-ota` GitHub environment restricts dispatches
to main. Merging a PR does not publish an OTA.

Each successful publication creates an annotated tag:
`ota/<runtime>/<UTC-date>-<workflow-run>-<attempt>`. The annotation records the EAS
update ID, group, runtime, platform, and source commit. The publication JSON is also
saved as a workflow artifact before delivery verification. If publication succeeds
but tagging or delivery verification fails, inspect that artifact and EAS before
retrying: rerunning the publish step would create another update.

Historical October 21 releases use descriptive tags ending in `quantities`,
`performance`, or `settings-cleanup`. Tags preserve the exact published commits;
maintenance branches advance with subsequent fixes. GitHub release tags are
protected against modification and deletion.

## Support and recovery

Support the latest two publicly released App Store versions. After 1.0.7 ships,
retire 1.0.5 only after an explicit upgrade window and any required upgrade prompt.
Remove retired versions from workflow choices; retain their branches and tags for
history. The current release retains 1.0.5 and 1.0.6.

For a regression, identify the last known-good update group for the same runtime
from the tag or EAS. Re-publish that group using EAS after verifying its database
compatibility. Do not blindly roll back to an embedded pre-cutover bundle: it may
point at the former database. Database rollback is separate from OTA rollback.
