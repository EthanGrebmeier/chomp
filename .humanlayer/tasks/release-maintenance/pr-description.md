## Why the change

Bring the released quantity contribution model, shopping and editing improvements, and runtime-specific release maintenance into main so future fixes have one development source and safe OTA backports.

## Special things to note

- Production quantities use the migrated Instant app `5df33e29-252b-4e1c-a111-53787beccba3`; backup/import/reconciliation tooling and release evidence are included, while private snapshots and credentials remain untracked. Database rollback and remaining old-client/account-cleanup work are separate from this merge.
- iOS 1.0.5/build 50 and 1.0.6/build 56 already have compatible quantity, performance, and Settings-cleanup OTAs; 1.0.7/build 62 is the native TestFlight candidate. Maintenance branches freeze native inputs, and future OTA publication requires an explicit GitHub workflow dispatch and reviewed SHA.
- Validation: lint and TypeScript pass; 598 unit tests pass with 3 opt-in SDK tests skipped; the new release-guard regression test accepts JS backports and rejects native dependency changes. This merge does not publish another OTA or App Store release.

## Change outline

```text
Grocery, recipe, meal, and saved-item actions
  → quantity contributions + serialized durable operations
  → indexed projections
  → shared shopping and editing views

Production data
  → private backup + verified import/reconciliation
  → migrated database + legacy-session handoff

main
  → selected fixes cherry-picked with source attribution
  → release/1.0.5 or release/1.0.6
  → required validation + frozen native inputs
  → manual publish of reviewed SHA
  → production EAS update + immutable annotated tag
```
