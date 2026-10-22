---
title: 'Suggestion title writes bypass React Native text synchronization'
severity: 'minor'
---

## Expected Behavior
Selecting a suggestion after editing a previous pick updates both the title and saved-item identity.
## Current Behavior
The input and provider both wrote titles using setNativeProps while suppressing change events, risking mismatched text and selection.
## Possible Solution
Use a controlled title in the shared item form and a single selection callback. Implemented; native device verification remains.
## Minimal Reproducible Example
Select a suggestion, edit its title, then select another suggestion.
## Context
Found while separating new-item save intent from saved-item sync intent in the add sheet.
