---
title: 'Local instant.schema.ts can drift from the deployed Instant schema with no check'
severity: 'minor'
---

### Expected Behavior

Removing a required attribute from `instant.schema.ts` is either pushed with the change or caught by a check before it breaks writes.

### Current Behavior

Commit bc49466 removed the required `meal_plan_recipes.addedToList` attribute and stopped writing it, but `pnpm push-schema` was only a manual step in the commit message. The deployed schema still required it, so every add-meal transaction failed with `validation-failed: Missing required attribute meal_plan_recipes/addedToList`. `pnpm tsc` passes because the types come from the local file.

### Possible Solution

Add a `pnpm check-schema` script that runs `instant-cli pull schema` into a temp dir and diffs it against `instant.schema.ts`.

### Minimal Reproducible Example

Run `npx instant-cli pull schema` in a temp dir with the repo's .env and grep for `addedToList`. It is still required remotely even though the local file no longer has it.

### Context

Hit this while adding a meal to the meal plan right after finishing the live meal plan sync issue (#26).
