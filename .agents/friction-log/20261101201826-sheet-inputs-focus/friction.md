---
title: 'Sheet inputs focus before TrueSheet installs its keyboard observer'
severity: 'minor'
---

## Expected Behavior
Sheet footer actions stay above the keyboard.

## Current Behavior
Quantity, category, store, and custom-unit inputs focus in onWillPresent, before TrueSheet 3.9 installs its iOS keyboard observer in didPresent. The keyboard event can be missed. Recipe URL autoFocus has the same risk.

## Possible Solution
Focus from onOpen (didPresent), after the observer is installed.

## Minimal Reproducible Example
Open Set quantity or Create category with the software keyboard enabled; the footer can remain behind the keyboard.

## Context
Audit of native sheet forms and installed TrueSheet lifecycle source.
