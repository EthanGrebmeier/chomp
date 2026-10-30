## Why the change

Ship the committed startup improvements, purchased-item history, faster item taps, and multiline note resizing fixes.

## Special things to note

- Includes the five commits from a7daf1c through bb6be19; release backports preserve frozen native inputs.
- OTA exports use the approved production database and enable the quantity release flag for runtime 1.0.7.
- Validation: lint, TypeScript, unit tests, release configuration, and native baseline checks before publication.

## Change outline

```text
App startup → cached list initialization → splash dismissal → deferred planner
Grocery list → tap to toggle → purchased history grouped by date
Item sheet → multiline notes → height follows text
```
