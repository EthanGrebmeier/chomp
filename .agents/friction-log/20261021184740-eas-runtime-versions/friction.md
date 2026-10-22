---
title: 'EAS runtime versions reused across native SDK changes'
severity: 'minor'
---

### Expected Behavior

Release tooling identifies an unambiguous production target.

### Current Behavior

Runtime 1.0.5 is shared by Expo SDK 56 builds 47–50 and SDK 57 build 52 on production. Runtime 1.0.4 also spans SDK 55 and 56.

### Possible Solution

Inventory actual released builds before OTA publishing; use distinct runtimes for native changes.

### Minimal Reproducible Example

Compare eas build:list runtime and sdkVersion fields for builds 50 and 52.

### Context

Mapping OTA release branches for quantity rollout.
