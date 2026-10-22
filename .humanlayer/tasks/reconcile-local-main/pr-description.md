## Why the change

Reconcile four unpushed local-main commits with GitHub main so their applicable rendering and animation improvements are retained alongside the current quantity implementation.

## Special things to note

- This is a true merge of local main at `5cc2ca4`, retaining all four original commits: `800762c` (recipe title), `60b3430` (checkbox timing), `5dadae5` (render/animation stutter), and `5cc2ca4` (version bump).
- Version 1.0.7 and Reanimated native flags were already present and remain unchanged. The removed legacy editor and meal-plan-link query stay removed; editor callback stabilization is applied to the current quantity editor. The optimistic checkbox wrapper, quantity writes, source labels, and shopping-mode presentation are retained.
- Validation: lint, TypeScript, 581 unit tests, and release configuration/guard checks pass; 3 opt-in SDK tests are skipped. React Doctor reports 87/100 with existing grocery-list warnings. Device animation QA and publication are not part of this reconciliation.

## Change outline

```text
local main: four preserved commits
  + current GitHub main: quantity release and cleanup
  → reconciliation merge
      recipe titles use itemTitle
      checkbox fill stays mounted and animates on the UI runtime
      strikethrough uses transforms, immediate intent, and recycled-row reset
      category results, bulk handlers, and quantity editor callbacks stay stable
      obsolete editor/query implementation remains retired
```
