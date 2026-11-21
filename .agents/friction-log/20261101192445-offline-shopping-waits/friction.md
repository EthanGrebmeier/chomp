---
title: 'Offline shopping waits for network-only verification and action reads'
severity: 'major'
issue: 'EthanGrebmeier/chomp#148'
---

## Expected Behavior
Downloaded lists open and accept durable edits without connectivity.
## Current Behavior
Fresh quantity verification blocks cached list editing. Store conflicts and recipe additions use network-only queryOnce. A Clerk restore failure can discard cached auth after a grace period.
## Possible Solution
Use persisted subscriptions for local reads; retain server checks when committing. Preserve cached sessions through refresh failures.
## Minimal Reproducible Example
Load a list online, force quit, enable airplane mode, and reopen the app.
## Context
Observed while shopping with poor cell service after list-loading optimizations.
