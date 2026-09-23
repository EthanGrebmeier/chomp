---
title: 'Codebase is not prettier-clean; formatting a directory rewrites unrelated files'
severity: 'minor'
---

## Expected Behavior

Running prettier on a feature directory only changes files I edited.

## Current Behavior

`pnpm prettier --write features/meal-planner features/recipes/instant` reformatted ~20 unrelated files (e.g. meal-time-sheet.tsx, edit-item-sheet.tsx) that had to be reverted by hand.

## Possible Solution

One-time `pnpm format` commit, and/or a pre-commit hook using the existing `format:staged` script.

## Minimal Reproducible Example

`pnpm format:check` on main.

## Context

Hit while refactoring the meal-plan → grocery list add flow.
