[#41 — UI exploration](https://github.com/EthanGrebmeier/chomp/issues/41) | [Quantity contribution PRD](https://github.com/EthanGrebmeier/chomp/blob/exploration/quantity-contributions-ui/plans/grocery-quantity-contributions/prd.md)

## Why the change

An isolated Edit Item preview lets us approve how multiple quantities and their sources should appear before changing production grocery data.

## Special things to note

- This is a development-only, React-local simulation; no production grocery or meal writes or schema changes are included.
- The current breakdown layout is the approved visual target, but the native iOS/Android walkthrough and screenshots are still pending; this is not a production-ready integration.
- Different units stay on separate rows rather than using the earlier demo’s editable custom total; the PRD also records a separate one-time cutover direction, which still requires implementation and proof.

## Change outline

```text
Settings (development only)
  → Quantity contributions demo (simulated list and history)
    → Edit item preview (shared name/notes fields, local metadata)
      → read-only total + source-specific quantity rows
        → Add/adjust quantity sheet (draft until confirmed)
          → plan-backed removal warns about simulated deselection
```

```text
app/demos/quantity-contributions.tsx        # demo launcher, reset and local state
features/grocery-list/quantity-demo/        # fixture model, totals, sheets, source labels and tests
components/item-sheet/item-fields.tsx       # shared presentation fields for preview and live form
app/settings.tsx + features/settings/        # development-only entry point
plans/grocery-quantity-contributions/prd.md # approved visual target and rollout direction
```
