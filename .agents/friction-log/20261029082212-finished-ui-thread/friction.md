---
title: 'Finished UI-thread checkbox styles revert when FlashList moves rows'
severity: 'major'
issue: 'EthanGrebmeier/chomp#127'
---

### Expected Behavior
Unchecked rows remain visually unchecked when moved from Checked to their original section.

### Current Behavior
Reproduced on the iPhone 17 Pro simulator after a full reload: unchecking cream and milk clears their boxes and strokes, but both return when rows move. Accessibility and model values remain unchecked. Reanimated retains mount-time React styles while synchronous native updates alter only the visible view.

### Possible Solution
Commit the final opacity and transform through React when the animation completes, keeping the native layout baseline aligned with finished feedback.

### Minimal Reproducible Example
Check cream and milk, expand Checked, uncheck both, then allow the section-settle delay to move them.

### Context
Reanimated 4.5.1, FlashList 2.2.1, synchronous UI prop flags enabled. Item keys alone did not resolve the issue.
