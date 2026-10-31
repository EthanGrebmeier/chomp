---
title: 'Reanimated custom CSS timing strings pass tsc but fail on native'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#71'
---

## Expected Behavior
A custom transition timing curve works on native.
## Current Behavior
The cubic-bezier string passed TypeScript but Reanimated rejected it at runtime as an invalid predefined timing function.
## Possible Solution
Use the exported cubicBezier helper for transitionTimingFunction. Applied to saved-item action crossfades.
## Minimal Reproducible Example
Set transitionTimingFunction to a cubic-bezier string on Animated.View and open the add-item sheet.
## Context
Reported during device use after lint and TypeScript passed.
