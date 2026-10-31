---
title: 'Frequent-item rows use pager gesture buttons inside a native sheet'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#118'
---

## Expected Behavior
Tapping a frequent item promptly fires its haptic and removes the row.

## Current Behavior
Both are reported as delayed. Frequent rows use GestureHapticPressable, unlike the other controls in the same sheet, and rerender remaining rows after each optimistic removal.

## Possible Solution
Use the standard HapticPressable already used in this sheet, preserve handled keyboard taps, and memoize rows with a stable add callback. Implemented; physical-device latency verification remains.

## Minimal Reproducible Example
Open Add Item, select Recent Items, and tap a row or its plus button. Compare the delay with recipe controls in the same sheet.

## Context
features/frequent-items/components/frequent-items-screen.tsx. The haptic runs before persistence, so database latency alone cannot explain delayed feedback.
