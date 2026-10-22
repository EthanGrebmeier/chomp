---
title: 'Recipes settings toolbar remains visible when hidden'
severity: 'minor'
---

## Expected Behavior
The shared recipes/settings toolbar disappears when useRecipesSettingsBar receives visible: false.

## Current Behavior
During simulator testing, entering shopping mode removed toolbar actions temporarily from the accessibility tree, but the toolbar remained visibly rendered after the opacity transition.

## Possible Solution
Conditionally mount the toolbar in RecipesSettingsBarHost when visible. Applied alongside shopping mode so hidden controls cannot remain onscreen.

## Minimal Reproducible Example
Open a grocery list in the iOS simulator, then choose Start shopping and a store. Before the fix, the recipes/settings pill remained at bottom left despite visible: false.

## Context
Found while validating the dedicated store shopping screen on iPhone 17 Pro, iOS 26.5.
