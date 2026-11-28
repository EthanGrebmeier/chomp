---
title: 'Ancestor tap capture dismisses keyboards in nested native sheets'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#70'
---

## Expected Behavior
Suggestion taps keep the meal-plan input focused.

## Current Behavior
The grocery-list root capture handler called Keyboard.dismiss() on every tap. Native meal-plan sheets remain descendants in the React responder tree, so their taps blurred the input before suggestion onPress refocused it. The grocery add sheet is a sibling and was unaffected.

## Possible Solution
Fixed by blurring only searchInputRef instead of dismissing the globally focused keyboard.

## Minimal Reproducible Example
Open the meal planner, switch to Plan item, type cof, and tap a coffee suggestion. Temporary focus and keyboard-event diagnostics showed HIDE, BLUR, PICK, SHOW, FOCUS before the fix and only PICK after it.

## Context
Verified in the iOS simulator. Native presentation does not isolate React responder capture handlers.
