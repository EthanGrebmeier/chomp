# Quantity implementation status

Updated October 20, 2026, for `exploration/grocery-quantity-rethink`.

The normal development app now implements manual quantities, scheduled and standalone planned contributions, independent direct-recipe snapshots, derived totals, contribution editing, unit-safe combining, shopping metadata, frozen purchase history, and saved-item metadata sync. This is branch completion, not a claim that the work is merged or enabled in production.

## Reduced backlog

Keep three actionable issues, plus #40 as the parent:

| Issue                                                    | Remaining work                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#49](https://github.com/EthanGrebmeier/chomp/issues/49) | Verify/fix cross-list moves and recipe deletion under concurrent edits. Persisting operations together does not ensure independent list histories accept them together. Preserve separate amounts and source deselection; do not duplicate quantities or leave half-applied lifecycle changes.                                                                              |
| [#51](https://github.com/EthanGrebmeier/chomp/issues/51) | Focused release QA: normal entrypoints, shared-list edits/revocation, offline reconnect and process death with pending edits, saved-item sync/retry/ownership, and iOS/Android UI smoke checks. Record failures and fix them; reuse existing automated evidence rather than rebuilding every proof. Check realistic history sizes for obvious replay/rendering regressions. |
| [#53](https://github.com/EthanGrebmeier/chomp/issues/53) | One production rollout: backup and a recoverable migration preserving rows/totals/history/links; enforce old-client rejection and test an actual old/new build including queued reconnect; require the updated client; audit an ordinary and shared list before reopening writes. Keep a short pause/restore procedure.                                                     |

## Ticket disposition

- #41–43 remain closed. #43 originally rejected an earlier protocol; the current immutable-operation model and its SDK evidence supersede that candidate, not its historical findings.
- #45–48 and #50 are complete as development implementation tickets. Release validation is tracked once in #51 and production enablement once in #53.
- #49 is narrowed to its outstanding cross-list correctness gap. Saved-item association/sync, unit boundaries, duplicate choices, and ordinary row operations are implemented.
- #44 and #52 are superseded by #53. Their unfinished fence and migration work is consolidated, not declared completed.
- #40 remains open as the parent until release.

## Confirmed behavior

Planned entries navigate to the focused meal-plan editor; they are not directly editable/removable in the grocery sheet. Deleting a whole unchecked row deselects all of its planned sources. Manual/direct amounts remain independently editable. The sequential Apples example is 5 → 4 → 5; changing the planned amount without first removing the direct entry gives 6.

Name, notes, category and store edits sync back to an owned linked saved item; quantities do not. Combining retains the destination row's existing association. Imports and moves preserve the association, and prior development imports can recover it by original row ID. Earlier additions that discarded identity cannot be repaired safely by name.

No special visible legacy/unattributed label, automatic unit conversion, permanent compatibility bridge, or further visual exploration is required.

## Evidence and limits

The current automated run passes 539 tests, with two live SDK tests skipped. Repository lint, TypeScript and quantity-specific lint pass. Prior live SDK and iOS simulator observations are in `evidence/`; they are not new device or production-fence results. React Doctor reports existing warnings across the broader branch.

The feature remains restricted to development builds on the allowlisted test database. No production schema push, migration, permissions change or release is part of this bookkeeping and commit pass.
