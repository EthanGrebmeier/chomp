---
title: 'Production auto-submit requires saved App Store Connect app ID'
severity: 'minor'
---

## Expected Behavior
The production EAS build with auto-submit queues TestFlight submission without interactive setup.

## Current Behavior
The build uploaded successfully, but auto-submit stopped because submit.production.ios.ascAppId was missing.

## Possible Solution
Resolved by saving the existing App Store Connect app ID in eas.json and separately scheduling submission for the already-created build.

## Minimal Reproducible Example
Run eas build --platform ios --profile production --auto-submit --non-interactive without ascAppId configured.

## Context
Encountered while preparing 1.0.7 build 62. No duplicate build was started.
