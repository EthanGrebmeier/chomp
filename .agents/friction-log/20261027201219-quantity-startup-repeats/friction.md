---
title: 'Quantity startup repeats legacy repair before loading list history'
severity: 'major'
---

## Expected Behavior
Previously initialized lists should load without repeating legacy migrations.

## Current Behavior
Every launch queries workspace metadata and materializes complete history for saved-item link repair before mounting the live workspace, which fetches and materializes history again.

## Possible Solution
Cache successful migration completion per user and list while retaining fresh access verification before editing. Mount the meal planner only when opened.

## Minimal Reproducible Example
Cold launch an account with existing quantity lists and trace ensureQuantityList followed by useQuantityWorkspace.

## Context
Investigated slow first item render and delayed interaction after splash dismissal.
