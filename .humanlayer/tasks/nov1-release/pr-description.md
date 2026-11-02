## Why the change

Preserve the November 1 release review and verified OTA publication records for recovery and traceability.

## Special things to note

- All three production iOS update endpoints served the recorded IDs; native baselines remained unchanged.
- Lint, TypeScript, and CI passed; unit tests passed 684/684/705 across runtimes 1.0.5/1.0.6/1.0.7, with three network-gated tests skipped per lane.
- Physical-device smoke checks remain unverified; native launch setting changes require the next binary.

## Change outline

```text
release records
├── PR descriptions: main and three runtime backports
└── OTA evidence: update ID, group, runtime, and merged commit
```
