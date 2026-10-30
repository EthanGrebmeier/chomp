---
title: '# Startup route tuple check depends on generated Expo route types'
severity: 'minor'
---

## Expected Behavior

TypeScript validation agrees between development checkouts and clean release worktrees.

## Current Behavior

The startup check reads segments[1] after narrowing segments[0] to (tabs). A clean checkout reports TS2493, while generated Expo route types in an existing development checkout hide the failure.

## Possible Solution

Use segments.length === 1 to identify the root tabs route. Applied in the October 27 release backports and main.

## Minimal Reproducible Example

Check out the October 27 startup changes into a fresh worktree, install dependencies, and run pnpm tsc without first generating Expo route types.

## Context

Found during release validation for runtimes 1.0.5, 1.0.6, and 1.0.7.
