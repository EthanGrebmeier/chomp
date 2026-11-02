## Why the change

Make downloaded shopping data and ordinary edits usable offline while improving sheet layout, keyboard focus, and shopping gestures.

## Special things to note

- Backport to 1.0.7; native inputs and dependencies match the frozen build baseline. TestFlight keeps its quantity feature gate enabled with EXPO_PUBLIC_QUANTITY_RELEASE=1.
- Lint, TypeScript, and unit tests pass, including offline restart and queued edits; physical-device checks remain unverified.
- React Doctor reports one compiler optimization limitation around try/finally and three maintainability warnings.

## Change outline

```diff
 startup and shopping actions
- wait on network checks and server acknowledgement
+ restore cached data and persist local edits before acknowledging
+ sync queued work on reconnect
 sheets and shopping rows
+ full-height selectors, reliable keyboard focus, purchase details
+ touch-down haptics and momentum-aware swipe deletion
```
