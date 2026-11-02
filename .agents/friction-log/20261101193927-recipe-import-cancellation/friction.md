---
title: 'Recipe import cancellation and save failure dispatch unsupported GO_BACK transitions'
severity: 'major'
---

### Expected Behavior
Cancelling an active recipe parse returns to URL entry. A failed recipe save leaves the saving screen.

### Current Behavior
Static inspection shows handleCancelImport aborts parsing then dispatches GO_BACK from loading. The createRecipe onError callback also dispatches GO_BACK from saving. importReducer accepts GO_BACK only from error or preview, leaving both busy states unchanged.

### Possible Solution
Add explicit cancellation and save-failure transitions and regression coverage. Existing RESET and SAVE_ERROR events can inform the intended behavior.

### Minimal Reproducible Example
Start URL parsing and cancel before it completes; follow loading + GO_BACK through importReducer. Separately force createRecipe to fail after confirmImport; follow saving + GO_BACK. Both return the original state. This was established by static inspection, not a device run.

### Context
Found while inventorying implicit state machines. See features/recipes/hooks/useImportRecipeFlow.tsx:152 and :193, and features/recipes/hooks/useImportRecipeState.tsx:111.
