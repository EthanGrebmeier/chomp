---
title: 'Quantity permission modifiedFields guard does not reject unlink'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#63'
---

### Expected Behavior
An operation update rule excluding workspace from request.modifiedFields prevents relationship removal.

### Current Behavior
The real SDK accepted unlink while the rule allowed exact body retries and rejected workspace in request.modifiedFields. A missing link can hide an operation from member reads.

### Possible Solution
Make operation records strictly create-only. Recognize ambiguous retries by reading and comparing the stored workspace, author and payload. The SDK test now verifies forward and reverse unlink and relink denial.

### Minimal Reproducible Example
Run pnpm test:quantity:sync with an update rule that compares unchanged scalar fields and excludes workspace from request.modifiedFields. The existing intent cannot be unlinked assertion fails. See scripts/quantity/test-app.mjs for the corrected create-only rule.

### Context
Isolated quantity workspace in the allowlisted development app. Other application rules and records are unchanged.
