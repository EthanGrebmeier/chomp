# Quantity contribution UI exploration (#41)

Product decision: the current Edit Item quantity-breakdown UI is the approved
visual target for contribution support. This approves the layout and interaction
direction, not production data behavior or rollout. Native iOS/Android review
and screenshots remain unverified; do not treat this exploration as device QA.

Open **Settings → Quantity contributions demo** in a development build, or
`/demos/quantity-contributions`. Release builds redirect away from the route.

All quantities, edits, removals, and simulated deselections are React-local state.
This folder imports no database, meal mutation, item-sheet provider, or production
write helpers. Closing a sheet retains edits in the launcher; resetting the demo
or leaving the route discards them. Name, notes, category, and store edits also stay
local. Metadata pickers use built-in categories and fixture stores, with no create
or production query paths.

## Contribution rows

- Amount and source appear in a compact tappable row; tapping opens a stacked
  contribution sheet. Each entry shows **source name → ingredient note (if any)
  → provenance/date**. Planned entries use the meal-schedule sentence shape,
  e.g. “Planned for dinner on October 23rd,” rather than a separate meal tag
  or dot-separated metadata. Only quantities for the same grocery item
  are grouped; source names are not additional grocery items. Quantities are
  never edited inline, including for a single manual entry.
- **Contribution sheet** (`contribution-sheet.tsx`): auto-height stacked sheet with
  an “Adjust quantity” header (or “Add quantity” for a new entry), a large
  quantity field, and a separate Remove action for existing entries. The source,
  note, and provenance stay in the tappable row, not the adjustment sheet.
  Edits are a draft until confirmed; closing otherwise discards them. The decimal pad has no
  keyboard "Done" accessory (no `returnKeyType`), so the sheet fits its content.
  Only plan-backed entries ask for confirmation before removal, since they also
  deselect the meal.
- The Quantity heading shows the total beneath it, with a + button on the right
  that opens the same minimal sheet without a subtitle.
- A single manual entry uses the same tappable row as other entries. A single
  source-backed entry still shows its source. Totals are calculated, never editable.
- Close and reopen an item to see retained demo-local edits. The sheet and its
  child dialogs contain no demo labels or controls. The simulation notice remains
  on the launcher.
- The preview shares `ItemNameField` and `ItemNotesField` with the production form,
  plus `BottomSheet.Header`, `BottomSheet.SheetView`, `MetaBarLayout`,
  `ScrollingMetaBar`, and `Pill`. It uses an auto-height sheet, like the production edit sheet.
- The layout is name → notes → Quantity → category/store pills. There is no separate item title,
  category/store subtitle, labeled shopping-note block, or Close preview button.
- For a reproducible initial preview, use the development deep link
  `chomp://demos/quantity-contributions?item=mixed` from a fresh route.

## Retained conventions and proposed differences

| Before                                                                                     | After in this isolated exploration                                           |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Compact duplicate sheet uses existing BottomSheet, muted context, and quantity comparisons | Reuses the sheet and theme primitives with compact source sub-items          |
| Item sheet exposes quantity through its metadata bar                                       | Dedicated Quantity section, separate from shopping notes and metadata        |
| One item-level source sentence                                                             | Each contribution identifies its own source instance                         |
| Duplicate demo allows a different-unit custom total                                        | Different-unit items remain separate rows; no conversion or custom aggregate |
| Item is the shopping/checkable unit                                                        | Contributions have no checkboxes; checked/deleted snapshots are read-only    |

Contribution rows prioritize inspection and long labels, at the cost of a tap
to edit. This is the approved visual direction; production item-sheet behavior
and the existing duplicate-resolution demo remain unchanged.

## Manual device review (pending)

Run on both iOS and Android and capture screenshots/recording before production UI
work. Visual direction has product sign-off, but an iOS simulator launch was attempted and
its “Open in Chomp?” system confirmation blocked automated visual inspection;
no rendered-sheet screenshot has been verified.

1. Open Apples (5 each). Tap the Apple pie row and change it from 2 to 3.
   Total is 6; Apple butter and Extra remain unchanged. Close and reopen Apples to
   verify retention.
2. Edit amounts through contribution sheets, including decimals. Total
   recalculates; zero is valid and distinct from empty. Dismissing an invalid
   draft leaves the original amount unchanged.
3. Remove Apple butter; only that contribution
   disappears, without a prompt. Tap +, then go back without confirming: nothing is added. Tap + again, enter an amount
   and confirm; a separate manual entry appears. Edit an amount and swipe away:
   the original amount remains.
4. Remove Apple pie. Confirm the warning explains the deselection consequence;
   no actual meal changes. Cancel removal once as well.
5. Open Bananas for the single-manual row. Add an entry, then remove entries
   down to zero and add again.
6. Open Tomatoes: the same recipe is scheduled on separate dates with distinct
   amounts; its ingredient note precedes the sentence-style meal and date.
   A standalone planned item has no invented source title, just “Meal plan,”
   a note, and its planned meal sentence. Review long source names, missing notes, zero, large text,
   VoiceOver/TalkBack, keyboard visibility, scrolling, and auto-height behavior.
7. Apples (500 g) stays separate from Apples (each), including after edits.
8. Purchased/deleted Apples remain unchanged and have no editing controls.
9. Edit the name and notes, and choose a category/store using the pills. Verify the
   launcher reflects the local edits and closing/reopening retains them. Compare
   the name, notes, header, and metadata styling with the production edit sheet.
10. Reset simulated data restores all original snapshots.

Fixtures reflect available source fields: scheduled recipes carry their recipe
name, ingredient snapshot note, planned date and optional meal tag; direct
recipe additions carry a recipe name and optional ingredient note but no invented
per-add timestamp; standalone planned items have a name equal to the grocery
item, note, date and optional meal tag, but no separate source name. Manual
additions are labeled Extra without an invented timestamp. These are proposed
future contribution states: production grocery rows currently store one scalar
quantity and at most one linked source, not separate recoverable entries.

Automated checks cover parsing, derived totals, source details, fixture isolation,
repeated-entry IDs, and separation of different-unit/history fixtures. They do not replace the
native device walkthrough.
