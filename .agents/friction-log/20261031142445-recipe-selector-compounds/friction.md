---
title: 'Recipe selector compounds its child gutters in composer sheets'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#139'
---

### Expected Behavior
Recipe filters and rows align with the composer mode selector.

### Current Behavior
RecipeSelector added 16 points of outer padding while RecipeFilters and RecipeCard each added another 16, yielding a 32-point gutter against the 16-point composer header.

### Possible Solution
Implemented an explicit spacing option: standard for composer hosts, wide by default for standalone picker sheets.

### Minimal Reproducible Example
Open Add item, switch to Add Recipe, and compare the mode selector with the search field and recipe names on the prior layout.

### Context
Found and corrected while refining sheet headers and recipe ingredient selection. Shared child components own internal gutters, which was easy to double-count at the selector boundary.
