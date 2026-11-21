---
title: 'Number-pad TextInput with returnKeyType adds a Done accessory'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#55'
---

### Expected Behavior

An auto-height bottom sheet with a numeric input fits its content just above the keyboard.

### Current Behavior

Setting `returnKeyType` (e.g. `"done"`) on a `decimal-pad`/`number-pad` TextInput makes React Native's iOS `RCTBaseTextInputView` attach a default input accessory with a Done button. In a TrueSheet it shows as a floating "Done" pill and pushes the sheet up, leaving dead space above the keyboard.

### Possible Solution

Omit `returnKeyType`/`onSubmitEditing` on numeric keyboards unless the accessory is wanted. Fast Refresh doesn't remove an attached accessory, so reopen the sheet to verify.

### Minimal Reproducible Example

`<TextInput keyboardType="decimal-pad" returnKeyType="done" />` inside `BottomSheet` with auto detent; see `features/grocery-list/quantity-demo/contribution-sheet.tsx` (before the fix).

### Context

Polishing the quantity contribution sheet in the quantity demo.
