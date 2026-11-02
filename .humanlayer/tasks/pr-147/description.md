## Why the change

Make downloaded shopping data and ordinary edits usable offline while improving sheet layout, keyboard focus, and shopping gestures.

## Special things to note

- Native update launch settings apply to the next binary; OTA backports preserve each installed runtime’s native configuration.
- Lint, TypeScript, and 684 unit tests pass, including offline restart and queued edits; physical-device checks remain unverified.
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
