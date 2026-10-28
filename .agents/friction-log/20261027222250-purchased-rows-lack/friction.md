---
title: 'Purchased rows lack a purchase date and cleared purchase marker'
severity: 'minor'
---

## Expected Behavior
Purchased history can group purchases by date and retain them after clearing the list.

## Current Behavior
Rows store only createdAt and status. Clearing checked rows changes status to deleted, losing the distinction from unpurchased deletions.

## Possible Solution
Add purchasedAt and preserve an undated marker when clearing legacy checked rows. Implemented in this change. Previously cleared rows remain unidentifiable from current state.

## Minimal Reproducible Example
Check an item, then clear checked items. Inspect its row: it has status deleted and no purchase date.

## Context
Found while implementing the purchased items view.
