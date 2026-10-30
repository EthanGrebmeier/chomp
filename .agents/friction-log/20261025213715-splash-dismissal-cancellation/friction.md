---
title: 'Splash dismissal cancellation can leave app permanently covered'
severity: 'major'
---

## Expected Behavior

The splash hides once startup becomes ready, including after readiness changes cancel a pending delay.

## Current Behavior

RootLayoutContent marks hasHiddenSplashRef before its 300 ms timer fires. Effect cleanup can cancel that timer, and the flag then prevents all subsequent hide attempts. A rollback also carries this existing race.

## Possible Solution

Set the flag inside the timer callback and add cancellation/retry regression tests.

## Minimal Reproducible Example

Schedule dismissal, run effect cleanup at 100 ms, then rerun the ready effect. The original code never calls hide.

## Context

Investigating a physical TestFlight build 62 stuck at splash. Device metadata confirms the recovery OTA launched; three fake-timer tests cover the fix and two fail with the original behavior.
