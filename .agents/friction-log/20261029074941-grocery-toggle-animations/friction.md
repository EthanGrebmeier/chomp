---
title: 'Grocery toggle animations depend on the JS tap queue'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#126'
---

## Expected Behavior
Repeated grocery taps start feedback immediately.

## Current Behavior
JS Pressable callbacks must run before UI-thread animations start, so quantity persistence and replay can delay taps.

## Possible Solution
Set visual intent in native tap gestures before scheduling persistence. Preserve each requested boolean for rapid reversals.

## Minimal Reproducible Example
Check several grocery items while prior writes are processing.

## Context
Checkboxes and shopping-mode rows. Regression coverage now exercises a blocked RN queue and cancelled taps.
