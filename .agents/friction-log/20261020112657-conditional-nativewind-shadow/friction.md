---
title: 'Conditional NativeWind shadow triggers misleading navigation-context crash'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#66'
---

## Expected Behavior
Switching a tab can change its selected styling without crashing.

## Current Behavior
Adding shadow-sm shadow-black/5 only when a previously unselected View becomes selected triggers a NativeWind variable upgrade warning. Its diagnostic serializer traverses React internals and throws the NavigationStateContext missing-context error, hiding the actual styling warning.

## Possible Solution
Keep variable-producing styles present from the initial render, or avoid conditional shadow utilities. The Add Item mode control now changes only its background.

## Minimal Reproducible Example
Render a tab View without shadow classes. On selection, append shadow-sm shadow-black/5. In the Expo development build, switch from Item to Recipes. The stack enters react-native-css-interop render-component stringify and NavigationStateContext.getKey.

## Context
Found while testing the compact Add Item sheet in the iOS simulator. Lint and TypeScript both passed; switching modes exposed the runtime crash.
