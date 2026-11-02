---
title: 'Local React Native types differ from frozen release install'
severity: 'minor'
---

## Expected Behavior
Local TypeScript and clean release validation agree.

## Current Behavior
Local TypeScript accepts a Pressable state containing hovered, but frozen CI installs reject the excess property.

## Possible Solution
Use a shared structurally compatible idle state and validate each frozen dependency graph.

## Minimal Reproducible Example
Run pnpm tsc after a frozen install; components/ui/button.tsx fails with TS2353 for hovered.

## Context
Found while preparing November 1 OTA backports.
