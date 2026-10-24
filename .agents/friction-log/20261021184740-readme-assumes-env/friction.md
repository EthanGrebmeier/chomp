---
title: 'README assumes .env.local points at production'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#76'
---

### Expected Behavior

Release tooling identifies an unambiguous production target.

### Current Behavior

The README says .env.local targets production, but the quantity workspace now uses it for the allowlisted test database.

### Possible Solution

Verify app identity against EAS production configuration and pass an explicit app ID when downloading backups.

### Minimal Reproducible Example

Read the app ID in .env.local and compare it with features/quantity/config.ts.

### Context

Preparing the first production backup before quantity rollout.
