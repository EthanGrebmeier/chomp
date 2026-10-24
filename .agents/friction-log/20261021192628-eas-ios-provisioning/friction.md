---
title: 'EAS iOS provisioning profile references a missing distribution certificate'
severity: 'blocker'
issue: 'EthanGrebmeier/chomp#77'
---

## Expected Behavior
The replacement iOS build starts with saved EAS credentials.

## Current Behavior
The provisioning profile is expired and references a distribution certificate that Apple no longer has. Credential setup fails before build creation.

## Possible Solution
Repair the saved iOS distribution certificate and provisioning profile, then retry without auto-submit.

## Minimal Reproducible Example
Run eas build --platform ios --profile production --non-interactive --no-wait from the quantity-native-1.0.7 worktree.

## Context
EAS incremented the remote build number from 59 to 60 before failing. No artifact was created or submitted.
