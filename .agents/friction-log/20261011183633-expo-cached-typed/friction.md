---
title: 'Expo cached typed routes reject new demo route during tsc'
severity: 'minor'
---

## Expected Behavior
Adding a route and immediately running pnpm tsc recognizes its typed navigation path.

## Current Behavior
The cached .expo/types/router.d.ts omits app/demos/meal-plan-duplicates.tsx, so its Settings navigation path is rejected.

## Possible Solution
Document a route-type regeneration command for standalone type checks. A narrow Href assertion matches the current lib/navigation.ts convention without editing generated files.

## Minimal Reproducible Example
Add app/demos/meal-plan-duplicates.tsx, navigate with router.push("/demos/meal-plan-duplicates"), then run pnpm tsc before starting Expo.

## Context
Encountered while implementing a development-only duplicate-resolution demo. Existing generated routes are stale until Expo regenerates them.
