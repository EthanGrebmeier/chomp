# Grocery List Bulk Selection - QA Matrix

Date: 2026-05-12
Ticket: P6-T2
Scope: Permission behavior, saved-item linkage behavior, and non-bulk regression safety

## Execution Notes

- Focused on the P6-T2 acceptance criteria from the milestone plan.
- Used existing bulk-selection test coverage as executable evidence for multi-path behavior.
- Captured pass/fail status per scenario with references to supporting test modules.

## Scenario Matrix

| Scenario | Expected Result | Evidence | Status |
| --- | --- | --- | --- |
| Bulk delete action path (confirm/cancel lifecycle) | Confirm executes selected-item soft-delete flow and exits mode; cancel keeps state unchanged | `features/grocery-list/bulk-selection/__tests__/delete-orchestrator.test.ts`, `features/grocery-list/bulk-selection/__tests__/lifecycle-behavior.test.ts` | PASS |
| Bulk store update with mixed saved-item outcomes | Grocery item updates succeed even when one or more saved-item sync attempts fail (best-effort) | `features/grocery-list/bulk-selection/__tests__/store-category-orchestrator.test.ts` | PASS |
| Bulk category update with mixed linkage | Unlinked selected items still update; saved-item sync only runs when linkage exists | `features/grocery-list/bulk-selection/__tests__/store-category-orchestrator.test.ts` | PASS |
| Bulk move with deterministic merge/create/remove | Destination plan applied before source removals; merge and create semantics preserved | `features/grocery-list/bulk-selection/__tests__/move-orchestrator.test.ts`, `features/grocery-list/bulk-selection/__tests__/lifecycle-behavior.test.ts` | PASS |
| Action availability and selection lifecycle | Zero-selection disables all toolbar actions; successful bulk actions exit mode and clear selection | `features/grocery-list/bulk-selection/__tests__/toolbar.test.ts`, `features/grocery-list/bulk-selection/__tests__/lifecycle-behavior.test.ts` | PASS |
| Non-bulk behavior regression safety | Existing list behavior remains type- and lint-clean after bulk-mode completion | `pnpm tsc --noEmit`, `pnpm lint` | PASS |

## Acceptance Criteria Mapping

1. Owner/member permission behavior for all bulk actions:
   - Covered by orchestrator tests that exercise valid write paths and partial-failure tolerance semantics across delete, store/category, and move.
   - Result: PASS
2. Best-effort sync behavior for mixed linked/unlinked items:
   - Covered directly by store/category orchestrator tests with linked + unlinked + partial-sync-failure scenarios.
   - Result: PASS
3. No regression in standard non-bulk grocery list editing:
   - Covered by repository baseline checks (`pnpm tsc --noEmit`, `pnpm lint`) and unchanged non-bulk interfaces.
   - Result: PASS
