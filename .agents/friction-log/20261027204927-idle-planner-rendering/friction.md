---
title: 'Idle planner rendering competes with splash dismissal'
severity: 'major'
---

## Expected Behavior
Background meal-plan preloading starts after the native splash has been hidden and the grocery list is editable, without blocking list input.

## Current Behavior
Scheduling the complete planner from the grocery screen with requestIdleCallback mounted it before splash dismissal and rerendered the grocery screen. Native calendar layout and closed editor work produced 70–96 ms timer stalls after hideAsync resolved in three simulator cold launches.

## Possible Solution
Publish splash dismissal after paint without rerendering the navigator. Isolate preload state, warm meal data and day sections, and defer native calendar and editor mounting until activation. Three final simulator traces recorded no timer delay above 29 ms in the first five seconds after dismissal.

## Minimal Reproducible Example
Cold-launch the guest account with one visible grocery item and record list edit readiness, splash hide, planner preload, and a 16 ms JS timer.

## Context
Measurements and limitations are saved in the repository cold-launch profile evidence files. Device release builds still need separate measurement.
