---
title: 'Release 1.0.5 Reanimated lacks sheet exit target-value helper'
severity: 'minor'
---

## Expected Behavior
Shared sheet motion can be backported without changing native dependencies.

## Current Behavior
Release 1.0.5 uses Reanimated 4.3.1, which lacks FadeOutRight.withTargetValues, causing TypeScript to fail.

## Possible Solution
Use an equivalent Keyframe exit with the same distance, duration, easing, and reduced-motion setting.

## Minimal Reproducible Example
Backport ba9e6f0 to release/1.0.5 and run pnpm tsc.

## Context
Found while preparing October 30 OTAs. Native dependencies must remain frozen.
