---
title: 'Expanded composer sheets remain detached with fractional native detents'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#142'
---

## Expected Behavior
Recipe browsing sheets reach the bottom screen edge while item entry floats.

## Current Behavior
The 94% custom detent leaves native iOS 26 sheets detached even after card spacing is reset.

## Possible Solution
Use detents={[1]} with automatic inset handling for expanded views. Preserve auto sizing for compact item entry.

## Minimal Reproducible Example
Open Add Item and switch to Add Recipe on iOS 26. Observe the bottom gap. Reopen after changing native presentation props during Fast Refresh.

## Context
Verified on the iPhone 17 Pro simulator. Both grocery and meal-plan composers shared this configuration.
