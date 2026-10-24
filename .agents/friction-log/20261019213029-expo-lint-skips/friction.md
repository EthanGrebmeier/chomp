---
title: 'Expo lint skips the features directory by default'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#62'
---

### Expected Behavior
The required pnpm lint check scans feature modules, where most application logic lives.

### Current Behavior
The expo lint default inputs are src, app and components. pnpm lint passes while a direct ESLint run of features/quantity finds errors.

### Possible Solution
Pass explicit project source directories to expo lint, or use eslint with a repository-wide glob. Until that coverage is enabled, lint changed feature paths explicitly as well.

### Minimal Reproducible Example
Run pnpm exec eslint features/quantity --no-cache and compare with pnpm lint. DEFAULT_INPUTS in the installed Expo CLI excludes features.

### Context
Validating the contribution model implementation. A passing default check alone does not establish feature code quality.
