---
title: 'Unmounting quantity TrueSheet before dismissal leaves a native sheet onscreen'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#64'
---

### Expected Behavior
Completing an action closes its sheet and returns to the updated list.

### Current Behavior
Clearing the React modal state immediately after save left a native TrueSheet visible with no accessible controls in the iOS simulator.

### Possible Solution
Call the native dismiss method first. Clear React modal state or present the next sheet from onDismiss. The quantity useSheetController centralizes this lifecycle.

### Minimal Reproducible Example
In the quantity workspace move a row and confirm, with onConfirm calling setModal(null) before dismiss. The move persists but the sheet remains visible. Verify the fixed transition in the iOS simulator.

### Context
Discovered in the native quantity acceptance pass; unit tests did not exercise the native presentation lifecycle.
