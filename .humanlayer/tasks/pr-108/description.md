## Why the change

Restoring a saved shopping session pushed the app outside the tabs before splash dismissal, leaving an otherwise running app permanently covered.

## Special things to note

- Confirmed on TestFlight build 62: the latest recovery bundle was running, and opening the grocery-list picker directly immediately exposed the app.
- Signed-in app routes now count as valid landing destinations; startup still waits for authentication, navigation, fonts, and update readiness.
- Route regression tests cover restored Shopping, other app routes, root redirects, and signed-out routing; the earlier cancellation/retry splash tests also remain in place.

## Change outline

```diff
 Authenticated cold launch → restore list → restore Shopping
- Splash accepts only (tabs), so Shopping remains covered
+ Splash accepts the resolved signed-in route, including Shopping
 Signed-out startup
  Still waits for the (auth) route
```
