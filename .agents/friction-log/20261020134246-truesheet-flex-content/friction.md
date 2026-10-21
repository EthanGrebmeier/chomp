---
title: 'TrueSheet flex content uses screen height instead of visible detent height'
severity: 'minor'
---

## Expected Behavior
A flex-based card inside a fractional-height TrueSheet stays within the visible sheet, including its footer.

## Current Behavior
On iOS the native viewControllerDidChangeSize implementation passes screenHeight to the React Native shadow node. A flex-1 card therefore extends below the visible sheet, hiding its bottom corners and placing Add to List outside the touchable viewport.

## Possible Solution
Bound the custom card root to the same explicit height used to compute the detent; use insetAdjustment never and reserve the bottom safe-area gutter inside that height.

## Minimal Reproducible Example
Render a transparent TrueSheet with detents={[0.94]}, scrollable enabled, and a flex-1 rounded card containing a flex list plus a footer. Open the Add Item recipe browser and select a recipe. Before the fix the card extends below the phone and the footer cannot be tapped.

## Context
Found while correcting the floating recipe/recent views in the Add Item prototype. Static lint and TypeScript checks do not catch the native frame mismatch.
