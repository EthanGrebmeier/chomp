# Unit Editing + Expanded Units

## Goals

- Expand built-in unit options to cover common recipe imports.
- Let users enter a custom unit via a dedicated "Custom" option.
- Keep existing behavior such as `each` rendering as `xN`.

## Non-goals

- No schema or permission changes.
- No unit conversion or measurement math.
- No localization or i18n work.

## Assumptions

- Units remain stored as plain strings.
- Missing or empty units should resolve to `each`.
- A reasonable max length (16 chars) protects layout.

## UX Flow

- Unit picker shows a richer catalog of standard units.
- Unit picker includes a “Custom” option in the list.
- Tapping “Custom” opens a separate “Edit unit” sheet.
- Edit unit sheet pre-fills the current value, autofocuses, and disables Save when empty.
- Custom unit values display everywhere a unit is shown.

## Technical Notes

- Centralize unit catalog in `components/item-sheet/units.ts`.
- Add unit helpers in `components/item-sheet/unit-utils.ts` for normalization and display formatting.
- Use the helpers anywhere unit display logic is duplicated.

## Tickets

### Ticket 1: Test tooling for unit utilities

Status: done  
Scope: Add a minimal test runner (Jest or Vitest) and config for TypeScript utility tests.  
Validation: Run a sample unit test in CI/local to confirm the setup works.

### Ticket 2: Unit catalog + helpers

Status: done  
Scope: Add expanded unit options (volume, weight, count, packaging) plus a “Custom” option, and create `normalizeUnit` + `formatQuantityUnit` helpers with a 16-char max length rule.  
Validation: Unit tests for normalization and formatting, including `each`, custom units, and empty/null inputs.

### Ticket 3: Edit unit sheet component

Status: done  
Scope: Build `EditUnitSheet` with text input, helper text, Save/Cancel, and keyboard “Done” handling.  
Validation: Manual check for open, save, cancel, and input validation.

### Ticket 4: UnitSheet integration

Status: done  
Scope: Use the shared catalog; when the “Custom” option is tapped, open the edit unit sheet; update the header to show custom units.  
Validation: Manual check that custom units persist through add and edit item flows.

### Ticket 5: Display consistency refactor

Status: done  
Scope: Replace inline unit display logic in list and recipe item components with `formatQuantityUnit`.  
Validation: Manual check that grocery list items, recipe ingredients, and meal plan items all render units consistently.

### Ticket 6: Edge-case handling

Status: done  
Scope: Normalize trimmed units, handle empty/null as `each`, enforce 16-char limit, and ensure custom units that match a catalog value behave predictably.  
Validation: Manual checks with empty units, 16+ char units, and units with special characters.

### Ticket 7: Cross-feature QA pass

Status: todo  
Scope: Validate custom units across recipe import edit flow, ingredient preview, meal plan items, and recipe-to-list actions.  
Validation: End-to-end manual demo flow covering import → edit → save → display.

## Demo Checklist

- Import a recipe with uncommon units, edit the unit via “Custom,” and save.
- Confirm custom units render in grocery list, recipe ingredient list, and meal plan.
- Verify `each` still renders as `xN`.
