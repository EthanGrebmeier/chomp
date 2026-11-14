---
title: 'Sheet bottom gutters stack visual spacing on safe-area clearance'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#140'
---

### Expected Behavior
Sheets should have one bottom gutter that preserves safe-area clearance without an extra blank band below the final control.

### Current Behavior
SheetBody and SheetFooter added 24 points to the safe-area inset. Several footer-backed picker bodies also retained bottom padding. IngredientSelector supplied the same bottom inset as both content padding and an iOS content inset, and reserved footer height even though its footer is in normal flow.

### Possible Solution
Implemented max(safeAreaBottom, 24) for sheet edge clearance, removed redundant body-to-footer padding, and kept a single ingredient-list trailing gutter. Removed empty delete-action spacing from create forms.

### Minimal Reproducible Example
Open Create list on an iPhone with a home indicator and inspect the gap below Create List. Compare category/store pickers and scroll ingredient selection to the last row on the prior layout.

### Context
Found during the requested cross-sheet bottom-padding audit. Fixed in the shared spacing components and affected callers.
