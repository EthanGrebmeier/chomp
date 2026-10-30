---
title: 'BackButton ignores its className prop and hardcodes negative margin'
severity: 'minor'
---

## Expected Behavior
Header layouts can control back-button alignment through className.

## Current Behavior
BackButton discarded className and always used -ml-1.5.

## Possible Solution
Fixed during shared sheet-header migration: honor className and use a 44-point target.

## Minimal Reproducible Example
Render BackButton with className set to ml-0; the prop is ignored.

## Context
Found while aligning headers across sheet views.
