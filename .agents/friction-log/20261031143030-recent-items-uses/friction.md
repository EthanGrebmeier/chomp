---
title: 'Recent Items uses a native scroll viewport larger than its composer'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#141'
---

### Expected Behavior
Recent Items should align with the composer selector and allow the final row to scroll fully above the bottom safe area.

### Current Behavior
Rows used 32-point gutters while the composer header used 16. TrueSheet native scroll pinning resizes the scroll viewport to its container bounds and overwrites contentInset.bottom; Recent Items also reserved outer bottom padding. This can clip the final rows in the bounded composer.

### Possible Solution
Use 16-point row gutters, reserve bottom clearance in contentContainerStyle, remove the outer bottom padding, and let Recent Items own its bounded viewport instead of native scroll pinning.

### Minimal Reproducible Example
Open Add item, switch to Recent Items with a long list, and scroll to the last row.

### Context
Follow-up to the sheet spacing audit. Source inspection confirms native resizing and content-inset replacement in TrueSheetContentView.mm.
