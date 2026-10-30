---
title: 'OTA instructions omit the TestFlight 1.0.7 quantity flag'
severity: 'minor'
---

## Expected Behavior

The release instructions identify every required public variable for each supported OTA runtime.

## Current Behavior

The documented main-branch OTA workflow omits EXPO_PUBLIC_QUANTITY_RELEASE, but release/1.0.7 still requires it to equal 1 in check-candidate.mjs and quantity/config.ts. Applying the main workflow environment to that lane fails validation.

## Possible Solution

Document the per-runtime flag or make the publication workflow set it for 1.0.7 until that lane is retired.

## Minimal Reproducible Example

In a release/1.0.7 checkout, run check-candidate.mjs with the approved EXPO_PUBLIC_INSTANT_APP_ID but without EXPO_PUBLIC_QUANTITY_RELEASE=1.

## Context

Found while preparing the shopping store grouping and recipe card OTA updates. The local 1.0.7 export explicitly sets the required flag.
