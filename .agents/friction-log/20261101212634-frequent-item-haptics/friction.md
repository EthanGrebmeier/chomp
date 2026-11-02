---
title: 'Frequent-item haptics trail touch feedback until release'
severity: 'minor'
---

## Expected Behavior
Haptics respond on touch-down.
## Current Behavior
Feedback runs on release after the native row collapses.
## Possible Solution
Schedule haptics on gesture begin; keep adding on completed tap. Implemented with a timing regression test.
## Minimal Reproducible Example
Press and hold a frequent item, then release. Feedback previously waited until release.
## Context
Frequent-items RecentItemPressable interaction.
