---
title: 'UnitSheet quantity input only accepts whole numbers'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#60'
---

### Expected Behavior

UnitSheet accepts decimal quantities (e.g. 0.5 kg), matching the i.number() quantity field.

### Current Behavior

components/item-sheet/unit-sheet.tsx parses with parseInt and uses keyboardType number-pad, so an existing 0.5 opens as invalid and decimals can't be entered.

### Possible Solution

Parse with Number (accepting comma decimals), use decimal-pad, validate finite > 0.

### Minimal Reproducible Example

Open UnitSheet for an item with quantity 0.5: the confirm button is disabled.

### Context

Blocked reusing UnitSheet for the duplicate-resolution custom total; wrote features/meal-planner/components/duplicate-custom-amount-field.tsx instead.
