---
title: 'Quantity entry verifies the complete history after subscribing to the same history'
severity: 'major'
---

## Expected Behavior
Sign-in should reveal a fully editable grocery screen within one second.

## Current Behavior
Each workspace subscribes to its full operation history, then performs a separate fresh full-history query before editing. A simulator profile measured 905 ms in the fresh verification query alone. Sign-in took 4292 ms before the later scheduling optimizations.

## Possible Solution
Prioritize the visible list and overlap independent reads now. Evaluate a server-validated snapshot plus newer operations to avoid complete-history reads on entry; this requires sync-protocol and migration review. Preserve fresh permission verification.

## Minimal Reproducible Example
Sign out and back in with an existing quantity list. Inspect the sign-in-ready stage timings.

## Context
The launch splash readiness gate did not address sign-in latency. The requested target is less than one second with editing ready at reveal.
