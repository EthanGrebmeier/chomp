# Sprint Plan Review: Edit Parsed Ingredients in Import Flow

## Summary of Recommendations

### ✅ Strengths
- Clear task breakdown with good separation of concerns
- Excellent reuse of existing components (`ItemForm`, `MetaBar`, `ItemSheetProvider`)
- Appropriate validation tests specified
- Logical task ordering overall

### ⚠️ Key Improvements Needed

1. **Move validation earlier** - Empty name/quantity validation should be in Task 2, not Task 6
2. **Split Task 5** - Keyboard handling → Task 2, Accessibility → Task 3
3. **Add missing edge cases** - Index invalidation, type conversions, cleanup
4. **Enhance test coverage** - Add integration tests, state immutability checks
5. **Fix architecture concerns** - Handle `ItemSheetProvider` reset behavior, type conversions

---

## Revised Sprint Plan

### Task 1: Add UPDATE_INGREDIENT action to import state machine

**Description**: Extend the import state machine to support updating an ingredient at a specific index.

**Files**:
- `features/recipes/types/import-state.ts`
- `features/recipes/hooks/useImportRecipeState.tsx`

**Changes**:
- Add `UPDATE_INGREDIENT` action type: `{ type: 'UPDATE_INGREDIENT'; index: number; ingredient: ParsedIngredient }`
- Add reducer case that updates the ingredient at the given index
- Add `updateIngredient(index, ingredient)` helper method

**Validation**:
- ✅ Unit test: `updateIngredient(0, updatedIngredient)` updates first ingredient
- ✅ Unit test: Invalid index (negative, out of bounds) does not crash
- ✅ Unit test: State only changes when in 'preview' status
- ✅ **NEW**: Unit test: Updating ingredient preserves other ingredients unchanged
- ✅ **NEW**: Unit test: Updating with same data is idempotent
- ✅ **NEW**: Unit test: State immutability (new array reference, not mutation)

**Commit**: `feat(recipes): add UPDATE_INGREDIENT action to import state`

---

### Task 2: Create EditParsedIngredientSheet component

**Description**: Create a new bottom sheet component for editing a parsed ingredient. This will reuse `ItemForm` and `MetaBar` components but manage local state instead of InstantDB.

**Files**:
- `features/recipes/components/import/edit-parsed-ingredient-sheet.tsx` (new)
- `features/recipes/utils/parsed-ingredient-converters.ts` (new - helper functions)

**Props**:
```typescript
type EditParsedIngredientSheetRef = {
  present: (index: number, ingredient: ParsedIngredient) => void;
  dismiss: () => void;
};

type EditParsedIngredientSheetProps = {
  onSave: (index: number, ingredient: ParsedIngredient) => void;
  onCancel?: () => void;
};
```

**Implementation**:
- Use `BottomSheet` component
- Wrap content in `ItemSheetProvider` with `mode="update"` and `disableAutocomplete={true}`
- Include `ItemForm` and `MetaBar` components
- Use `setFromItemRef` pattern (like `AddIngredientSheet`) to populate form
- On `present()`, populate form with ingredient data using converter helper
- On save, convert form state to `ParsedIngredient` and call `onSave`
- **NEW**: Auto-focus name input when sheet opens (`onOpen` callback)
- **NEW**: Dismiss keyboard when sheet closes (`onStartClose` callback)
- **NEW**: Override `ItemSheetProvider` validation to ensure quantity > 0

**Helper Functions** (in new utils file):
```typescript
function parsedIngredientToBaseGroceryItem(ingredient: ParsedIngredient): BaseGroceryItem {
  return {
    name: ingredient.name,
    quantity: ingredient.quantity ?? 1,
    unit: ingredient.unit ?? 'each',
    category: ingredient.category,
    notes: ingredient.notes ?? undefined,
  };
}

function baseGroceryItemToParsedIngredient(
  item: BaseGroceryItem, 
  originalCategory: IngredientCategory
): ParsedIngredient {
  return {
    name: item.name.trim(),
    quantity: item.quantity,
    unit: item.unit,
    category: originalCategory, // Preserve original category type
    notes: item.notes ?? null,
  };
}
```

**Validation**:
- ✅ Sheet opens when `present()` is called
- ✅ Form is pre-populated with ingredient data
- ✅ Save button calls `onSave` with updated ingredient
- ✅ Sheet dismisses after save
- ✅ All editable fields work: name, quantity, unit, category, notes
- ✅ **NEW**: Cannot save with empty name (validation)
- ✅ **NEW**: Cannot save with quantity <= 0 (validation)
- ✅ **NEW**: Cannot save with empty unit (validation)
- ✅ **NEW**: Cancel/dismiss doesn't trigger save
- ✅ **NEW**: Handles null quantity/unit gracefully (converts to defaults)
- ✅ **NEW**: Category is preserved through edit cycle
- ✅ **NEW**: Keyboard appears when sheet opens
- ✅ **NEW**: Keyboard dismisses when sheet closes
- ✅ **NEW**: Very long names are handled (no truncation needed - let user edit)

**Commit**: `feat(recipes): add EditParsedIngredientSheet component`

---

### Task 3: Make IngredientListPreview items tappable

**Description**: Add tap handling to ingredients in the preview list to trigger editing.

**Files**:
- `features/recipes/components/import/ingredient-list-preview.tsx`

**Changes**:
- Add `onEdit?: (index: number, ingredient: ParsedIngredient) => void` prop
- Wrap each ingredient item content in a `Pressable` (inside `ListItem`, like `RecipeIngredientItem`)
- Call `onEdit` with index and ingredient when tapped
- Add visual feedback for pressable state (opacity change or highlight)
- **NEW**: Add accessibility labels: `accessibilityLabel="Edit ingredient: {name}"`, `accessibilityHint="Double tap to edit this ingredient"`
- **NEW**: Update hint text: "Tap to edit, swipe left to remove"
- **NEW**: Prevent multiple rapid taps (debounce or disable while sheet is opening)

**Validation**:
- ✅ Tapping an ingredient calls `onEdit` with correct index and ingredient
- ✅ Visual feedback on press
- ✅ Swipe-to-remove still works (no interference with tap)
- ✅ `onEdit` is optional - component works without it
- ✅ **NEW**: VoiceOver/TalkBack announces tappable ingredients correctly
- ✅ **NEW**: Rapid taps don't open multiple sheets
- ✅ **NEW**: Long press doesn't interfere (if applicable)

**Commit**: `feat(recipes): make ingredient list items tappable for editing`

---

### Task 4: Wire edit sheet to import sheet

**Description**: Integrate the EditParsedIngredientSheet into the ImportRecipeSheet.

**Files**:
- `features/recipes/components/import/import-recipe-sheet.tsx`

**Changes**:
- Add ref for `EditParsedIngredientSheetRef`
- Create `handleEditIngredient` callback that calls `editSheetRef.present(index, ingredient)`
- Pass `onEdit={handleEditIngredient}` to `IngredientListPreview`
- Create `handleSaveIngredient` callback that calls `updateIngredient(index, ingredient)`
- Render `EditParsedIngredientSheet` with `onSave={handleSaveIngredient}`
- **NEW**: In `handleClose`, dismiss edit sheet if open: `editSheetRef.current?.dismiss()`
- **NEW**: Track if edit sheet is open to prevent multiple opens
- **NEW**: Handle index invalidation (ingredient removed while editing) - dismiss edit sheet

**Validation**:
- ✅ Tapping ingredient opens edit sheet
- ✅ Editing and saving updates the ingredient in the list
- ✅ Sheet dismisses after save
- ✅ Updated ingredient reflects in preview
- ✅ Flow continues normally after edit (can still import)
- ✅ **NEW**: Edit sheet dismisses when import sheet closes
- ✅ **NEW**: Only one edit sheet can be open at a time
- ✅ **NEW**: If ingredient is removed while editing, edit sheet dismisses gracefully
- ✅ **NEW**: Can edit multiple ingredients sequentially

**Commit**: `feat(recipes): integrate ingredient editing into import flow`

---

### Task 5: Handle remaining edge cases

**Description**: Handle edge cases and error scenarios not covered in previous tasks.

**Cases**:
- Index invalidation (already handled in Task 4, verify)
- Category type preservation (already handled in Task 2, verify)
- Empty ingredients list after edit (verify import still works)
- Form state persistence (verify form doesn't retain data between edits)

**Files**:
- `features/recipes/components/import/edit-parsed-ingredient-sheet.tsx`
- `features/recipes/components/import/import-recipe-sheet.tsx`

**Validation**:
- ✅ All edge cases from original Task 6 are verified
- ✅ Form resets properly between edits
- ✅ Import works correctly after editing ingredients
- ✅ No memory leaks or state persistence issues

**Commit**: `feat(recipes): handle edge cases in ingredient editing`

---

### Task 6: Final UX polish (if needed)

**Description**: Any remaining UX improvements discovered during testing.

**Potential items**:
- Loading states during save
- Error handling for save failures
- Animation improvements
- Additional accessibility enhancements

**Commit**: `feat(recipes): polish ingredient editing UX`

---

## Architecture Notes

### Type Conversions

The conversion between `ParsedIngredient` and `BaseGroceryItem` needs careful handling:

1. **ParsedIngredient → BaseGroceryItem**:
   - `quantity: null` → `1` (default)
   - `unit: null` → `'each'` (default)
   - `notes: null` → `undefined`
   - `category` is preserved (required field in ParsedIngredient)

2. **BaseGroceryItem → ParsedIngredient**:
   - `quantity` must be > 0 (validated)
   - `unit` must be non-empty (validated)
   - `category` must be preserved (use original category from `present()` call)
   - `notes: undefined` → `null`

### ItemSheetProvider Behavior

- `ItemSheetProvider` resets on `onStartClose` - this is fine for our use case
- Built-in validation: `isValid: !!itemInputValue.length && !!quantity && !!unit`
- Need to enhance validation to ensure `quantity > 0`
- `setFromItemRef` pattern allows parent to populate form

### ListItem Component

- `ListItem` doesn't support `onPress` prop
- Need to wrap content in `Pressable` (see `RecipeIngredientItem` pattern)
- Swipe gesture uses `Gesture.Pan()` - tap on `Pressable` should work independently
- Test to ensure no gesture conflicts

---

## Testing Strategy

### Unit Tests
- State machine reducer (Task 1)
- Type conversion helpers (Task 2)
- Component rendering and callbacks (Tasks 2, 3)

### Integration Tests
- Full edit flow: tap → edit → save → verify update (Task 4)
- Edit → cancel → verify no change (Task 4)
- Edit → dismiss parent → verify cleanup (Task 4)
- Multiple sequential edits (Task 4)

### Manual Testing Checklist
- [ ] Edit ingredient name
- [ ] Edit ingredient quantity
- [ ] Edit ingredient unit
- [ ] Edit ingredient category
- [ ] Edit ingredient notes
- [ ] Cancel edit (dismiss sheet)
- [ ] Save edit and verify update
- [ ] Edit multiple ingredients sequentially
- [ ] Remove ingredient while editing (edge case)
- [ ] Close import sheet while edit sheet is open
- [ ] Keyboard appears/disappears correctly
- [ ] Swipe-to-remove still works
- [ ] Accessibility (VoiceOver/TalkBack)
- [ ] Rapid taps don't cause issues
- [ ] Import works correctly after edits

---

## Risk Assessment

### Low Risk
- Task 1: Straightforward state machine extension
- Task 3: Simple prop addition and Pressable wrapper

### Medium Risk
- Task 2: Need to ensure `ItemSheetProvider` works correctly with local state
- Task 4: Integration complexity, need to handle cleanup properly

### Mitigation
- Test `ItemSheetProvider` with local state early (Task 2)
- Add comprehensive integration tests (Task 4)
- Manual testing of all edge cases before completion
