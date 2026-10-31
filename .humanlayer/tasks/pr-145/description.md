## Why the change

Make page and sheet spacing consistent, keep expanded composers attached to the screen edges, and simplify meal-plan and duplicate-item controls.

## Special things to note

- Application-only changes; maintenance backports preserve each runtime’s native dependencies and production database.
- 1.0.7 remains TestFlight-only and requires its existing quantity feature flag.
- Local lint and TypeScript checks pass; release validation also runs unit tests and frozen native baseline checks.

## Change outline

```text
Pages and sheets → shared spacing, headers, and footer conventions
Item and meal composers → full-height expansion with explicit style resets
Meal-plan controls → simpler shopping actions
Duplicate review → compact choices and separate comparison rows
```
