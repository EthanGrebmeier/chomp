# Grocery quantity contributions

Status: planning; no production enablement authorized by this document.

## Goal

Represent a grocery row as a shopping item containing independently editable quantity entries. A row may contain quantities from multiple scheduled meals, direct recipe additions, and manual additions. Keep the grocery list compact while making its quantity explainable in the edit sheet.

## Confirmed product decisions

- A grocery item can contain multiple separately identified quantity entries.
- Entries can originate from scheduled recipe ingredients, standalone planned items, direct recipe additions, or manual additions.
- Adding extra quantity creates a separate manual entry; it does not overwrite a meal's quantity.
- The combined total is calculated and read-only. Users edit individual entries.
- Removing an active scheduled recipe contribution from the grocery sheet deselects that ingredient for that scheduled meal, preventing sync from recreating it.
- Existing clients must be considered throughout rollout. Introduce a compatibility port and progressively retire legacy quantity behavior rather than replacing it in one release.
- The approved compact duplicate-resolution sheet is the production UI starting point.

## Example

Apples — 5 each

- Apple pie, Friday dinner — 2 each
- Apple butter, added from recipe — 1 each
- Extra apples, added manually — 2 each
- Add quantity

Removing Apple butter leaves 4 apples. Changing the pie entry to 3 leaves 6 apples. Removing the pie entry deselects its meal ingredient without removing the other entries.

## Proposed implementation defaults

These are recommendations, not additional user-confirmed decisions. Review them in S0 before enabling new behavior.

- Scheduled contributions follow their specific source instance. Explicit quantity edits write back to that meal's snapshot and establish its existing absolute-quantity override behavior, not a recipe-global edit.
- Direct recipe additions capture an immutable source snapshot; later recipe edits do not change shopping quantities. Each add operation is a distinct instance, including repeated adds of the same recipe.
- Manual entries are independent. Existing quantities whose provenance cannot be reconstructed become a clearly labeled legacy/manual entry, not fabricated recipe contributions.
- The grocery row owns shopping name, category, store, checked/deleted status, and general shopping notes. Entries preserve source identity and source labels/notes. Shopping metadata edits do not fan out to every recipe or source.
- One row has one normalized unit. Combine only matching units initially; no inferred conversions. Cross-store combining remains possible with an explicit resulting row store.
- Different-unit custom combined totals from the demo are deferred pending a separate allocation/conversion design. Do not implement them as an unexplained adjustment that destroys source quantities. This is a deliberate difference from the current demo and needs product acknowledgement in S0.
- One manual entry uses a familiar quantity control. Multiple entries, or any source-backed entry, show the breakdown. Neither case edits the aggregate directly.
- Checked/deleted items are history and never duplicate targets. Source updates do not silently change purchased quantities or resurrect deleted rows.

## Compatibility requirement

Keeping `grocery_items.quantity` and `unit` provides an old-readable projection, not safe old-writer compatibility. Released clients can overwrite quantities, write back to singular meal links, move items, or delete shared rows without understanding entries.

The rollout must prove a supported policy before contribution authority or merges are enabled:

1. Legacy lists continue current behavior on old and new clients.
2. Additive schema and a compatibility release ship before activation.
3. Upgraded lists retain old-readable fields, but unsafe old mutations must either be translated by a verified authoritative bridge or excluded by an explicitly approved, enforceable upgrade boundary.
4. A client-side flag, recent device heartbeat, app-version string, or lack of recent old traffic is not proof that offline old writers cannot return.
5. If seamless old-client editing of upgraded lists is mandatory and cannot be implemented safely with deployed infrastructure, activation is blocked. Do not silently reinterpret legacy total writes as manual entries or claim the requirement is satisfied by dual writes.

See `plan.md` for rollout gates, session-sized tasks, tests, and unresolved compatibility decisions.

## Non-goals for first release

- Automatic unit conversion or fuzzy ingredient matching.
- Editing an aggregate and distributing the difference among meals.
- Reconstructing historical recipe allocations from a single scalar quantity.
- Per-entry purchasing/checked state; the shopping row remains the checkable unit.
- Removing legacy fields or links before old-client retirement is separately verified.
- A new visual design exploration; reuse the approved compact sheet and existing item-sheet conventions.
