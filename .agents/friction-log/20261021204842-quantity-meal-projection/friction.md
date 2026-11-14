---
title: 'Quantity meal projection rescans the full shopping history for every meal'
severity: 'major'
issue: 'EthanGrebmeier/chomp#81'
---

## Expected Behavior
Opening a migrated list remains responsive with years of grocery and meal history.

## Current Behavior
The previous projection rebuilt all grocery rows and rescanned all documents for each meal. A production snapshot with 1062 rows and 77 meals took about 1980 ms in a desktop benchmark for meal projection alone.

## Possible Solution
Build row, entry, source, and store indexes once per projection. Reuse the same grocery projection for every meal and reuse projected entries in row memoization. Add a large-history traversal regression test. The revised benchmark takes about 2 ms.

## Minimal Reproducible Example
Project a migrated state with 1100 rows and 80 meals. Count full document enumerations; these must not scale with the product of rows and meals.

## Context
Reported after the quantity OTA release on signed-in accounts and reproduced in the running simulator. Small development fixtures and correctness tests did not expose this scale issue.
