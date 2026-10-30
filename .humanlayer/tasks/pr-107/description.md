## Why the change

Startup could remain behind the splash forever when a readiness change canceled its delayed dismissal after the code had already marked it hidden.

## Special things to note

- The device downloaded and launched the recovery OTA, which shares this startup race; rolling back UI changes alone cannot remove it.
- The hidden flag now changes only when the hide callback actually runs, so canceled effects can retry.
- Three fake-timer regressions cover cancellation/retry, unmount, and one-time dismissal; the original behavior fails these tests, and lint/TypeScript pass with the fix.

## Change outline

```diff
 Startup becomes ready
- Mark splash hidden → schedule hide
+ Schedule hide → mark hidden when callback runs → hide
 Startup effect cleanup
- Cancel timer but leave hidden flag set forever
+ Cancel timer and allow the next ready effect to schedule again
```
