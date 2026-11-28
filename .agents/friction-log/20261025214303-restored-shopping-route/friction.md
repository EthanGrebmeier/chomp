---
title: 'Restored shopping route is excluded from splash readiness'
severity: 'major'
issue: 'EthanGrebmeier/chomp#124'
---

## Expected Behavior

Cold launch into a saved shopping session dismisses the splash once auth and navigation are ready.

## Current Behavior

RootLayoutContent only considers the tabs or auth group a valid initial landing. GroceryList restores Shopping as a root-level route, so the splash remains even though the app and OTA have launched. Rolling back retains this older route guard.

## Possible Solution

Accept resolved signed-in app routes, including shopping, while retaining auth and navigation readiness checks.

## Minimal Reproducible Example

Leave a saved shopping session on the last-used list and cold-launch. Opening chomp://grocery-lists on the same stuck process immediately clears the splash.

## Context

Confirmed on the connected TestFlight build 62 by the user. Device update metadata proved the recovery bundle had launched; the timer cancellation fix alone did not resolve this route deadlock.
