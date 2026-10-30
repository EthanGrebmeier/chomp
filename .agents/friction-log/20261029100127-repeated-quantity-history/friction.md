---
title: 'Repeated quantity-history replay blocks checkbox debounce timers'
severity: 'major'
---

## Expected Behavior
Checking three items should leave JavaScript responsive and settle their group after the one-second quiet window.

## Current Behavior
Simulator instrumentation measured repeated 500–1100 ms history rebuilds. Refresh also accumulated duplicate confirmed operations, and save validation replayed history again.

## Possible Solution
Reuse validated unchanged replay prefixes, traverse causal generations without repeatedly scanning all remaining operations, share the cache with outbox commit validation, and deduplicate identical confirmed operations without hiding identity collisions. Added correctness regressions and measured the final batch timer at 1.48 seconds after the last toggle in the development simulator.

## Minimal Reproducible Example
Rapidly toggle three items on a list with roughly 130 prior operations and observe the section move arrive seconds after the intended debounce.

## Context
Quantity workspace reconstruction, commit validation, and grocery checked-state presentation.
