---
title: 'No .env.example documenting EXPO_PUBLIC_* variables'
severity: 'minor'
issue: 'EthanGrebmeier/chomp#9'
---

### Expected Behavior

A committed `.env.example` lists every environment variable the app reads, with a one-line comment describing each, so new contributors and new dev-only flags have a discoverable home.

### Current Behavior

The app reads several `EXPO_PUBLIC_*` variables (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_INSTANT_APP_ID`, Clerk keys, and now `EXPO_PUBLIC_MOCK_RECIPE_IMPORT`) but the only place they are enumerated is the gitignored `.env.local`. Discovering them requires grepping for `process.env`.

### Possible Solution

Add `.env.example` mirroring `.env.local` with values blanked and comments kept. Optionally add a `lib/env.ts` that reads and validates them in one place.

### Minimal Reproducible Example

```
ls .env*        # only .env.local
rg "process.env.EXPO_PUBLIC" --glob '*.ts*' | wc -l
```

### Context

Hit while adding a dev-only mock toggle for the recipe URL import flow (`features/recipes/api/mock-parse-recipe-url.ts`). The flag had nowhere to be documented except a comment in `.env.local`.
