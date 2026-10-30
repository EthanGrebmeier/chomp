## Why the change

Shopping should combine stores with the same name, and the recipe book should show the updated full-height card layout.

## Special things to note

- Store matching ignores case and extra whitespace, preserves saved shopping sessions, and keeps unassigned items separate.
- JavaScript and styles only; native dependencies and runtime configuration are unchanged.
- Shopping regression tests (12), lint, TypeScript, and React Doctor passed locally.

## Change outline

```diff
 Shopping mode
- Group and filter items by store ID
+ Group and filter by normalized store name
+ Restore either duplicate store ID to the combined destination
 Recipe book
- Individual compact list rows
+ Full-height grouped surface with ingredient counts, servings, and meal badges
+ Matching loading and empty states
```
