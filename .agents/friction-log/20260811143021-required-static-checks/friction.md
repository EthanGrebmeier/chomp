---
title: 'Required static checks fail before navigation validation'
severity: 'minor'
---

### Expected Behavior

`pnpm lint && pnpm tsc` completes cleanly so focused changes can be
validated against the repository baseline.

### Current Behavior

ESLint reports existing React hook errors in recipe import and item-sheet
files. Changed-file lint, TypeScript, and focused tests pass, but the required
repository-wide check remains red.

### Possible Solution

Fix or baseline the existing lint diagnostics.

### Minimal Reproducible Example

Run `pnpm lint && pnpm tsc` from the repository root.

### Context

This blocked the required repository-wide verification for an unrelated Expo
Router navigation-stack change.
