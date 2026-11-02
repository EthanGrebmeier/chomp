# Offline behavior

Offline shopping takes priority over loading optimizations. The native app must
open previously downloaded lists and save ordinary edits locally even when a
network connection hangs rather than reporting itself offline. See AGENTS.md.

## What works locally

- Instant persists authenticated sessions and live query results in AsyncStorage.
  List editing uses the complete cached workspace plus the durable, user/list
  scoped outbox. A fresh permission query is not a prerequisite for editing.
- Adds, checks, quantity changes, edits, deletions, and existing meal edits are
  persisted before their local action completes. Pending changes survive restart.
  Failed sync attempts remain visible locally and retry on the next authenticated
  connection; users can also retry explicitly.
- Store-conflict review and recipe additions/planning read the same cached query
  shapes used by the app. A missing cache produces a bounded error instead of
  waiting indefinitely. Optional store/category metadata cannot hide groceries.
- Local-capable TanStack mutations use `networkMode: 'always'`: shopping,
  meal-plan, catalog, and SQLite settings writes execute in airplane mode instead
  of remaining paused before their local writer runs. Settings publish the saved
  SQLite row directly to the query cache.
- List renaming, recipe/ingredient edits, saved items, stores, and
  categories use `transactLocally`. Instant updates subscriptions optimistically;
  action completion waits for its mutation queue to reach disk, not a server
  acknowledgement. Local saves are serialized, without serializing network
  waits. Saved-item attributes and store links are written in one transaction.
  Default-store and category validation read the downloaded query shapes.
- Save/create forms show pending feedback and prevent repeated submission; a
  successful local save closes the form with a confirmation. Inline edits show
  their new value; shopping checkboxes retain their immediate checked feedback.
- SQLite settings reads run regardless of network state.
- An absent Clerk session after a failed refresh does not erase Instant's cached
  session. Explicit account sign-out still clears both sessions. Known identity
  mismatches still require authentication rather than exposing another account.
- OTA checks/downloads run in the background, without holding the splash or
  reloading an active shopping session. Updates apply at the next cold launch.

## Tradeoffs and limits

- Cached data can be stale. A previously authorized user can still view and edit
  their downloaded data until the server reports revocation. Server permissions
  and fresh history checks remain mandatory when syncing. Rejected operations
  remain in the outbox; local completion does not mean server acceptance.
- Catalog/list-metadata writes use Instant's existing queue, not the quantity
  outbox. A server rejection or the SDK's connected-but-unresponsive timeout can
  roll them back; a global mutation-error notification asks users to review their
  latest edits, including for writes restored after restart. They are not retried
  by a second app queue. “Saved” means persisted locally, not accepted by the
  server. Shopping intents retain the stronger retry/reconciliation guarantees
  above. Default-store/category validation uses cached data and may race edits
  from another device.
- `transactLocally` isolates the SDK's internal `kv`/`querySubs` flush APIs because
  the public transaction promise is not a durability barrier. Its contract tests
  exercise the installed SDK's actual serialization and cold restart. SDK upgrades
  must keep those tests passing. Disk failure never reports local success; an
  already applied optimistic edit may still appear and may later reach the server.
- Concurrent changes can conflict during reconciliation. Stable operation IDs,
  original version guards, and conflict handling are preserved.
- Creating a new list (which needs a new quantity workspace), first sign-in,
  first migration from the old database, downloading an unseen
  list/recipe, invitations, remote recipe import, and account deletion need a
  connection. No local data can be recovered after uninstalling/clearing storage.
- Cross-list moves and recipe deletion across lists still need fresh server
  history and atomic commits. They are not converted to separate offline writes,
  which could leave half a move or inconsistent recipe contributions.
- The SDK's disk cache is bounded (currently one year / 1,000 query entries /
  1 million triples). This is downloaded-data support, not a guarantee that every
  list ever visited remains available forever. Background sessions warm lists
  after the visible list has loaded.
- Native OTA launch configuration changes require a new binary. The JavaScript
  update change can ship via OTA. Fixes and rollbacks downloaded in the background
  take effect on the next launch instead of interrupting the current session.
- These guarantees target the installed iOS/Android app. The static web build
  does not include an offline app-shell service worker.

## Verification

Automated regression coverage exercises cached offline startup, durable edit
recovery after restart, account-scoped outboxes, permission errors, corrupt
outboxes, cached imperative reads and their timeout/cleanup, auth reconciliation,
operation replay/deduplication, catalog queue persistence with a hanging server,
SDK queue recovery on restart, and disk-write failures.

Before release, test a production native build on a device:

1. Sign in and open lists, recipes, and shopping mode while online.
2. Force quit, enable airplane mode, and cold launch both home and restored shopping.
3. Add, check/uncheck, edit quantities, and delete items. Try a store conflict and
   add a downloaded recipe. Force quit again and confirm the edits survive.
4. Repeat with a connection that drops packets while reporting connectivity.
5. Reconnect and verify queued edits sync once. Repeat with another device editing
   the same list and with server access revoked; verify conflicts/rejections.
6. Sign out, switch accounts, and verify no prior account's lists/outbox appear.
7. Test a fresh install and an uncached list: online-only work must not be mistaken
   for downloaded data. Check that a background update never restarts shopping.

Device checks cannot be replaced by unit tests; they cover native storage timing,
Clerk restoration, the transport, and the installed update configuration.

## Purchase details

Checking off an item snapshots the signed-in session's account ID and email
(or “Guest”) with the local action timestamp in the same durable operation.
Viewing checked and cleared purchases needs no profile lookup or network request.
Unchecking removes both fields; checking again records a new purchase. Clearing
checked items preserves both fields. Older purchases without attribution or a
valid timestamp show unknown details rather than inferring them. Timestamps use
the device clock and display in the viewer's local time zone; identity labels
reflect the account at purchase time.

New shopping rows also snapshot who added them in the original durable operation,
including manual, recipe, and meal-plan additions. Combining into an existing row
keeps its original creator; moving a row preserves that creator too. Adding a
historical item again creates a new row attributed to the current shopper. Older
rows with no creator snapshot display “Unknown person.”
