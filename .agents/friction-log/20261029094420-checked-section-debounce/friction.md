---
title: 'Checked-section debounce follows serialized save publication instead of tap intent'
severity: 'major'
---

## Expected Behavior
Move toggled items together one second after the last tap.

## Current Behavior
The list stopped consuming pending checked intent, so serialized save publications restarted the timer at variable times.

## Possible Solution
Reconnect the pending-state overlay. Regression tests now cover staggered publications, reversals, rollback, and disposal.

## Minimal Reproducible Example
Check two items rapidly while their serialized durable writes publish at different times; observe grouping waits one second after the last publication.

## Context
GroceryItemsList and the quantity-session checked write queue.
