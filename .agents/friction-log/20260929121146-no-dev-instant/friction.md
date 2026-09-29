---
title: 'No dev Instant app configured for validating data migrations'
severity: 'minor'
---

### Expected Behavior

A documented dev/staging Instant app (app id + admin token) to run admin-SDK data migrations against before touching real data.

### Current Behavior

`.env.local` only points at a single Instant app, which holds real data. Migration scripts such as `scripts/backfill-meal-plan-ignored.mjs` can only be dry-run safely; a real run cannot be validated on a throwaway app.

### Possible Solution

Document a dev app in an env example (e.g. `.env.development.local`) and how to point scripts at it.

### Minimal Reproducible Example

Try to validate `node --env-file=.env.local scripts/backfill-meal-plan-ignored.mjs` (non dry-run) without risking production data.

### Context

Implementing MPS-02 (#12), whose validation asks for a real run against a dev app.
