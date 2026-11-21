---
title: 'NativeWind keeps stale styles when a reused component''s className changes'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#59'
---

### Expected Behavior

Changing a component's `className` from `h-auto min-h-12 flex-1 py-3` to `size-12` drops the removed classes.

### Current Behavior

When a conditional swaps two layouts that render a `Button` at the same tree position, React reuses the instance and NativeWind v4 keeps removed styles (`flex-1`), so the icon button stretched after returning from the review page.

### Possible Solution

Give each layout branch a distinct `key` to force a remount.

### Minimal Reproducible Example

Footer in features/meal-planner/components/duplicate-resolution-demo.tsx: review branch Back button (`flex-1`) vs stepper branch icon button (`size-12`), toggled by `conflict`.

### Context

Any toggled className on a reused NativeWind element can hit this.
