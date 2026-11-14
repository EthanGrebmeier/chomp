---
title: 'Quantity checkbox feedback waits for durable outbox and bypasses pending checked state'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#74'
---

## Expected Behavior
Checkbox feedback starts promptly after a completed tap.

## Current Behavior
The quantity path returns projected items without applying pendingCheckedState. Its serialized AsyncStorage write completes before setPending, workspace reconstruction, and effect-based session publication. The immediate intent recorded by checkListItem is bypassed.

## Possible Solution
Decouple immediate checkbox feedback from durable persistence while preserving rollback and rapid-toggle handling.

## Minimal Reproducible Example
In the quantity development app, toggle a grocery checkbox in shopping or editing mode. The user reports about half a second before the fill animation starts.

## Context
Measured on the iOS development simulator: 346 ms from onPress to row commit, including only 1 ms of storage and 24 ms of replay. Unused subscriptions, list rendering, and first-use lazy module loading delayed feedback. Local optimistic feedback with durable-publication handoff, a focused eager checkbox module, and stable projected rows reduced representative editing/shopping samples to 14/12 ms. A 761 ms injected storage delay still produced feedback in 15 ms; disk failure rolled feedback back. See plans/grocery-quantity-contributions/evidence/checkbox-latency.json. Temporary instrumentation and injected faults were removed.
