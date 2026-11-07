---
title: 'Imported ingredient editor has no visible save action'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#69'
---

## Expected Behavior
Imported ingredient edits can be saved.
## Current Behavior
The editor rendered ItemForm and MetaBar, but update-mode return only blurs and MetaBar has no submit action.
## Possible Solution
Implemented an explicit Save ingredient action through the shared compact editor.
## Minimal Reproducible Example
Import a recipe, open an ingredient, edit its name, and look for a save action.
## Context
Found and fixed while applying Add Item patterns to similar sheets.
