---
title: 'Legacy unit fixtures inherit the quantity release environment'
severity: 'minor'
---

## Expected Behavior
Legacy writer fixtures exercise their intended path independently of deployment environment variables.

## Current Behavior
Setting EXPO_PUBLIC_QUANTITY_RELEASE=1 and the approved Instant app ID caused 22 legacy tests to take quantity paths without quantity session fixtures.

## Possible Solution
Explicitly mock quantityWorkspaceAvailable as false in the five legacy suites. Quantity integration tests retain their own quantity fixtures.

## Minimal Reproducible Example
Run the full Vitest suite with the production quantity environment enabled.

## Context
Found while introducing required GitHub release validation. The default local environment had hidden this fixture dependency.
