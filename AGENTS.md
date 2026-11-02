## Philosophy

This codebase will outlive you. Every shortcut becomes someone else's burden. Every
hack compounds into technical debt that slows the whole team down.
You are not just writing code. You are shaping the future of this project. The
patterns you establish will be copied. The
corners you cut will be cut again.
Fight entropy. Leave the codebase better than you found it.

After making changes, run `pnpm lint && pnpm tsc`

## Friction log

- Log papercuts and friction (tooling, docs, APIs, tests, conventions) as you hit them with `pnpx frog log`.
- Do not add global, system, or internal friction.
- Run `pnpx frog list` first to see what is already known.

## Offline usability comes first

Offline usability takes priority over startup speed, freshness, and convenience.
Returning users must be able to cold-launch, read downloaded lists, and make
ordinary shopping edits with no service or a connection that hangs. Never gate
cached data or local editing on auth refresh, OTA checks, or server verification.
Persist edits before acknowledging them; sync and check permissions on reconnect.
Keep account caches isolated and honor explicit sign-out and server revocation.
Network-only actions must fail clearly without blocking the rest of the app.
For startup, auth, loading, or sync changes, add regression coverage for offline
restart and queued edits, and document any offline tradeoffs in docs/offline.md.
