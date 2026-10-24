---
title: 'Native SVG strokes reject space-separated theme HSL colors'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#73'
---

## Expected Behavior
Theme colors render in native SVG strokes.

## Current Behavior
The shopping progress ring was invisible on iOS with raw space-separated HSL theme tokens.

## Possible Solution
Normalize ring, primary, and chart2 tokens to comma-separated HSL before passing them to SVG. Applied in shopping-header.tsx.

## Minimal Reproducible Example
Render a react-native-svg Circle using theme.ring as its stroke. Compare with the token after replacing spaces with commas.

## Context
Found during simulator validation of the shopping header.
