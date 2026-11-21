---
title: 'Sign-in bypasses launch-only grocery readiness gate'
severity: 'major'
issue: 'EthanGrebmeier/chomp#130'
---

## Expected Behavior
After sign-in, reveal the grocery UI only when data and editing are ready.

## Current Behavior
The native splash gate has already finished; authentication redirects expose loading content and planner preloading competes with rendering.

## Possible Solution
Use an account-scoped entry cover, wait for list rendering and editing readiness, defer planner preload until reveal, and measure sign-in latency.

## Minimal Reproducible Example
Sign out, then sign back in with an existing grocery list on a slower connection.

## Context
The launch readiness fix does not cover later authentication transitions.
