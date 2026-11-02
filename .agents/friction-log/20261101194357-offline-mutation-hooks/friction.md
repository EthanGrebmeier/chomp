---
title: 'Offline mutation hooks pause durable local actions'
severity: 'major'
---

## Expected Behavior
Local shopping and settings actions execute and persist in airplane mode.

## Current Behavior
TanStack mutations default to online mode and can pause before the durable local writer runs.

## Possible Solution
Use networkMode always for local-capable mutation hooks and cover offline execution.

## Minimal Reproducible Example
Open a downloaded list, enable airplane mode, and trigger a meal-plan mutation through its hook.

## Context
Found during the optimistic action audit.
