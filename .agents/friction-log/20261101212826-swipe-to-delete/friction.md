---
title: 'Swipe-to-delete ignores flick momentum'
severity: 'minor'
---

## Expected Behavior
A deliberate leftward flick can delete in one swipe.

## Current Behavior
Deletion requires dragging 45% of screen width regardless of speed; shorter flicks only reveal the action.

## Possible Solution
Use guarded momentum projection and a shorter capped distance threshold. Implemented with release-intent regression tests.

## Minimal Reproducible Example
Flick a grocery row left about 100 points and release quickly. The previous implementation only revealed the trash button.

## Context
User reported difficulty deleting in one swipe. Shared component affects grocery and recipe rows.
