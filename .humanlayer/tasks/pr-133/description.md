## Why the change

Ship the recent grocery responsiveness, sign-in readiness, sheet layout, recipe, meal-plan, conflict-review, and purchase-history improvements.

## Special things to note

- Application-only changes; each OTA keeps its existing native dependencies and approved production database.
- Release 1.0.7 remains TestFlight-only; 1.0.5 and 1.0.6 remain supported App Store releases.
- Runtime 1.0.6 preserves all frozen native inputs; 657 tests passed.

## Change outline

```text
Grocery taps → immediate feedback → batched persistence and row movement
Sign-in → grocery readiness → reveal interactive screen
Sheets → shared headers and actions → inline store conflict review
Recipes and meals → unified ingredient selection → shopping visibility
Purchase history → compact search controls
```
