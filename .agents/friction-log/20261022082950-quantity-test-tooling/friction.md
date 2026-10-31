---
title: 'Quantity test tooling still allowlists the production database'
severity: 'major'
issue: 'EthanGrebmeier/chomp#84'
---

## Expected Behavior
Test tools reject production and checked-in permissions match deployed rules.
## Current Behavior
The former dev app is now production, but test-app.mjs and proof scripts still allowlist it. instant.perms.ts denies quantity namespaces.
## Possible Solution
Retire one-off writers, require a separate test environment with production rejection, and reconcile permissions.
## Minimal Reproducible Example
Compare scripts/quantity/test-app.mjs TEST_APP with eas.json production EXPO_PUBLIC_INSTANT_APP_ID: they match.
## Context
Found during post-release quantity cleanup. No test commands were run against production.
