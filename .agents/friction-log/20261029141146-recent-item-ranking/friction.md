---
title: 'Recent-item ranking rebuilds history on quantity updates'
severity: 'minor'
---

## Expected Behavior
Quantity updates should cheaply filter stable recent-item candidates.

## Current Behavior
useFrequentItems depends on both list and quantityItems. buildFrequentItems regroups the entire 90-day event history, creates new item objects, sorts, and limits results whenever quantityItems changes. This repeats history aggregation and invalidates memoized row props.

## Possible Solution
Separate event aggregation and ranking from current-list exclusion, retaining stable candidate objects.

## Minimal Reproducible Example
Inspect features/frequent-items/hooks/use-frequent-items.ts:129 and features/frequent-items/utils/frequent-items.ts. A changed quantityItems reference recomputes the entire ranking even with unchanged events.

## Context
Investigating slow recent-item removal during rapid adds. Source inspection only; device profiling is needed to quantify the cost.
