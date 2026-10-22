[GQC-02 — contribution rules and write paths](https://github.com/EthanGrebmeier/chomp/issues/42) | [Grocery quantity PRD](https://github.com/EthanGrebmeier/chomp/issues/40)

## Why the change

The contribution model needs agreed product rules and a map of existing scalar writers before implementation can safely replace the current one-source-per-grocery-row behavior.

## Special things to note

- Planned quantities now link to a focused meal-plan item for editing; deleting a whole unchecked grocery row still deselects every planned source in that row.
- Different-unit quantities cannot be combined, even though the older duplicate-resolution demo offers a UI-only custom-total option.
- Documentation only: no production writes, schema changes, old-client fence, or concurrency proof; those remain downstream gates.

## Change outline

```text
plans/grocery-quantity-contributions/
├── prd.md                               # confirmed quantity, navigation, history and cutover rules
└── gqc-02-decision-and-writer-map.md    # owner decisions, scalar writer matrix, model invariants and unknowns
```

```diff
 grocery row
-  one scalar quantity + at most one linked meal-plan source
+  read-only total from independently identified quantity entries
+  manual/direct-recipe entries → adjust in grocery sheet
+  planned entries → open the specific item in meal plan
+  whole-row delete/move → deselect planned sources; preserve other entries
```
