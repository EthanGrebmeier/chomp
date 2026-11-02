---
title: 'Autocomplete overwrites explicit item draft metadata'
severity: 'minor'
---

## Expected Behavior
Category and store choices survive selecting a suggestion.

## Current Behavior
Suggestion selection overwrote explicit draft metadata.

## Possible Solution
Track explicit choices, including cleared category and No store; reset tracking between items. Implemented in this change.

## Minimal Reproducible Example
Choose a category or store, type an item, and pick a suggestion with different metadata.

## Context
Add-item sheet metadata can now be chosen before entering a title.
