---
title: 'Uncontrolled multiline notes do not resize item sheets'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#120'
---

## Expected Behavior
Item sheets grow and shrink as note lines change.

## Current Behavior
Uncontrolled native notes changed text without updating input height in the iOS simulator. Removing maxHeight alone did not fix it.

## Possible Solution
Use controlled notes with synchronous React state updates so native text layout follows edits.

## Minimal Reproducible Example
Open Add Item, focus notes, and enter five lines. The uncontrolled input remained one line tall. With controlled notes, inserting and removing lines, wrapping text, and clearing notes all resize the sheet.

## Context
Found during simulator validation of item-sheet notes sizing.
