# Execution ledger

## Current state

Planning only. No schema, permissions, application behavior, or production data changed.

Next ticket: **QTY-01 — inventory writers and lock behavior contracts**.

Production activation blockers:

- Old-writer policy and enforceable compatibility proof (QTY-02).
- Verified concurrency, acknowledgement, and offline execution semantics.
- Product acknowledgement of proposed defaults, especially same-unit-only combining and deferral of custom combined totals.

## Ticket status

| Ticket | Stage                     | Status      |
| ------ | ------------------------- | ----------- |
| QTY-01 | S0 contracts              | not started |
| QTY-02 | S0 compatibility proof    | not started |
| QTY-03 | S1 pure domain            | not started |
| QTY-04 | S1 legacy port            | not started |
| QTY-05 | S1 writer routing         | not started |
| QTY-06 | S2 additive persistence   | not started |
| QTY-07 | S2 diagnostic migration   | not started |
| QTY-08 | S2 shadow mode            | not started |
| QTY-09 | S3 contribution execution | not started |
| QTY-10 | S3 manual/direct recipe   | not started |
| QTY-11 | S3 scheduled lifecycle    | not started |
| QTY-12 | S3 shared-row lifecycle   | not started |
| QTY-13 | S4 writer compatibility   | not started |
| QTY-14 | S4 list cutover           | not started |
| QTY-15 | S5 quantity components    | not started |
| QTY-16 | S5 live edit sheet        | not started |
| QTY-17 | S6 resolution planner     | not started |
| QTY-18 | S6 meal-plan UI           | not started |
| QTY-19 | S6 direct recipe UI       | not started |
| QTY-20 | S7 canary verification    | not started |
| QTY-21 | S7 retirement             | not started |

## Session handoff template

- Ticket:
- Status: not started / in progress / blocked / done
- Prerequisites and evidence:
- Files changed:
- Decisions accepted (distinguish product approval from implementation inference):
- Tests/commands and results:
- Migration/deployment actions (default: none):
- Compatibility/rollback implications:
- Remaining issues and follow-up ticket IDs:
- Recommended next ticket:

## Planning-session notes

- Inspected schema/permissions, existing planning conventions, manual add/increment/edit, recipe stacking, meal-plan add/sync/write-back/reconcile, bulk move, and migration tooling.
- Independent read-only compatibility audit confirmed stale full-snapshot writes on metadata edits, singular-source reconciliation/deletion hazards, split move transactions, unreconstructible historical recipe allocations, and offline queued writes as explicit gates.
- Last-selected scheduled contribution removal must deselect the source even though existing whole-row deletion may instead ignore a meal while preserving selection. This accepted new behavior is called out in QTY-01/QTY-11.
- Existing uncommitted duplicate-demo source work is outside this planning change and must be preserved.
- Validation: `pnpm lint && pnpm tsc` passed. Planning Markdown formatted with Prettier. No application tests or remote migration/deployment were needed for this documentation-only change.
