import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { IngredientSelector } from '../../../components/item-sheet/add-item/ingredient-selector';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { navigation } from '../../../lib/navigation';
import { Recipe, RecipeWithIngredients } from '../../recipes/types';
import { useDefaultStore } from '../../stores/instant/use-default-store';
import { useMealPlanOnlyToggle } from '../hooks/useMealPlanOnlyToggle';
import { useRemoveRecipeFromMealPlan } from '../hooks/useRemoveRecipeFromMealPlan';
import { useUpdateMealPlanRecipe } from '../hooks/useUpdateMealPlanRecipe';
import { useUserMealPlanData } from '../hooks/useUserMealPlanData';
import { isMealPlanOnly } from '../instant/meal-plan-entry';
import { MealPlanIngredientSnapshotStore } from '../instant/meal-plan-ingredient-snapshot-store';
import {
  MealPlanIngredientEditorRow,
  applyMealPlanIngredientOverride,
  getSelectedSourceIngredientIds,
  hydrateMealPlanIngredientEditorFromSnapshot,
  initializeMealPlanIngredientEditor,
  toggleAllMealPlanIngredientSelection,
  toggleMealPlanIngredientSelection,
} from '../meal-plan-recipe-ingredient-editor';
import { MealPlanRecipe } from '../types';
import {
  countUncheckedLinkedGroceryItems,
  withUncheckedLinkedGroceryItemsNotice,
} from '../utils/unchecked-linked-grocery-items';

import {
  MealPlanIngredientOverrideSheet,
  MealPlanIngredientOverrideSheetRef,
} from './meal-plan-ingredient-override-sheet';
import { AddToGroceryListSwitch } from './meal-plan-only';
import { MealScheduleSentence } from './meal-schedule-sentence';
import { MealSheetRecipeDropdown } from './meal-sheet-recipe-dropdown';

type EditMealSheetProps = {
  listId: string;
};

export type EditMealSheetRef = {
  open: ({
    mealPlanRecipe,
    recipe,
    onDismiss,
  }: {
    mealPlanRecipe: MealPlanRecipe;
    recipe: Recipe;
    onDismiss?: () => void;
  }) => void;
};

export const EditMealSheet = forwardRef<EditMealSheetRef, EditMealSheetProps>(
  ({ listId }, ref) => {
    const [mealTag, setMealTag] = useState<string | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(
      undefined
    );
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [ingredientRows, setIngredientRows] = useState<
      MealPlanIngredientEditorRow[]
    >([]);
    const [, setIsPersistingIngredientOverride] = useState(false);
    const [mealPlanRecipeToEdit, setMealPlanRecipeToEdit] =
      useState<MealPlanRecipe | null>(null);
    // Recipe the entry is linked to in the database. Swapping recipes replaces
    // the ingredient snapshots once saved, so rows load only after that.
    const [persistedRecipeId, setPersistedRecipeId] = useState<string | null>(
      null
    );

    const sheetRef = useRef<TrueSheet>(null);
    const changeRecipeSheetRef = useRef<TrueSheet>(null);
    const ingredientOverrideSheetRef =
      useRef<MealPlanIngredientOverrideSheetRef>(null);
    const { mutate: updateMealPlanRecipe } = useUpdateMealPlanRecipe();
    const { data: defaultStore } = useDefaultStore();
    const { mutate: removeRecipeFromMealPlan } = useRemoveRecipeFromMealPlan();
    // Shared with the planner view, so the entry's linked items stay live.
    const { recipes: mealPlanRecipes } = useUserMealPlanData(listId);
    const liveMealPlanRecipe = mealPlanRecipeToEdit
      ? mealPlanRecipes.find(recipe => recipe.id === mealPlanRecipeToEdit.id)
      : undefined;
    // Bumped to reload the ingredient rows after a change made outside the
    // editor, e.g. turning "meal plan only" off can select every ingredient.
    const [ingredientRowsVersion, setIngredientRowsVersion] = useState(0);
    const { isMealPlanOnly: mealPlanOnly, setMealPlanOnly } =
      useMealPlanOnlyToggle({
        entry: mealPlanRecipeToEdit
          ? { type: 'recipe', id: mealPlanRecipeToEdit.id }
          : null,
        isMealPlanOnly: isMealPlanOnly(
          liveMealPlanRecipe ?? mealPlanRecipeToEdit ?? {}
        ),
      });
    const lastSyncedSnapshotRef = useRef<string | null>(null);
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onDismissRef = useRef<(() => void) | undefined>(undefined);

    const getSnapshot = useCallback(
      (recipeId: string | null, mealTagValue?: string, dateValue?: string) =>
        JSON.stringify({
          recipeId,
          mealTag: mealTagValue ?? null,
          date: dateValue ?? null,
        }),
      []
    );

    const persistChanges = useCallback(() => {
      if (!mealPlanRecipeToEdit || !selectedRecipe) return;

      const snapshot = getSnapshot(selectedRecipe.id, mealTag, selectedDate);
      if (snapshot === lastSyncedSnapshotRef.current) return;

      updateMealPlanRecipe(
        {
          mealPlanRecipeId: mealPlanRecipeToEdit.id,
          updates: {
            recipeId: selectedRecipe.id,
            mealTag,
            servings: 1,
            date: selectedDate,
          },
        },
        {
          onSuccess: () => {
            lastSyncedSnapshotRef.current = snapshot;
            setPersistedRecipeId(selectedRecipe.id);
          },
          onError: () => {
            toast.error('Failed to update meal');
          },
        }
      );
    }, [
      getSnapshot,
      mealPlanRecipeToEdit,
      mealTag,
      selectedDate,
      selectedRecipe,
      updateMealPlanRecipe,
    ]);

    useImperativeHandle(ref, () => ({
      open: ({
        mealPlanRecipe,
        recipe,
        onDismiss,
      }: {
        mealPlanRecipe: MealPlanRecipe;
        recipe: Recipe;
        onDismiss?: () => void;
      }) => {
        setSelectedDate(mealPlanRecipe.date);
        setSelectedRecipe(recipe);
        setMealPlanRecipeToEdit(mealPlanRecipe);
        setPersistedRecipeId(recipe.id);
        setMealTag(mealPlanRecipe.mealTag ?? undefined);
        onDismissRef.current = onDismiss;
        lastSyncedSnapshotRef.current = getSnapshot(
          recipe.id,
          mealPlanRecipe.mealTag ?? undefined,
          mealPlanRecipe.date
        );
        changeRecipeSheetRef.current?.dismiss();
        sheetRef.current?.present();
      },
    }));

    const resetState = () => {
      setSelectedRecipe(null);
      setIngredientRows([]);
      setSelectedDate(undefined);
      setMealTag(undefined);
      setMealPlanRecipeToEdit(null);
      setPersistedRecipeId(null);
      lastSyncedSnapshotRef.current = null;
      changeRecipeSheetRef.current?.dismiss();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };

    const handleSheetDismiss = () => {
      const onDismiss = onDismissRef.current;
      onDismissRef.current = undefined;
      resetState();
      onDismiss?.();
    };

    const handleRemoveMeal = () => {
      if (!mealPlanRecipeToEdit) return;
      const mealPlanRecipeId = mealPlanRecipeToEdit.id;
      const recipeName = selectedRecipe?.name ?? 'this meal';

      Alert.alert(
        'Delete Meal',
        withUncheckedLinkedGroceryItemsNotice(
          `Are you sure you want to delete "${recipeName}" from your meal plan?`,
          countUncheckedLinkedGroceryItems({
            recipes: liveMealPlanRecipe ? [liveMealPlanRecipe] : [],
          })
        ),
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              removeRecipeFromMealPlan(
                { mealPlanRecipeId },
                {
                  onError: () => {
                    toast.error('Failed to delete meal');
                  },
                }
              );

              resetState();
              sheetRef.current?.dismiss();
            },
          },
        ]
      );
    };

    const handleRecipeChange = (recipe: RecipeWithIngredients) => {
      setSelectedRecipe(recipe);
      changeRecipeSheetRef.current?.dismiss();
    };

    const handleCreateRecipe = (initialName?: string) => {
      onDismissRef.current = undefined;
      router.dismissTo(navigation.goToCreateRecipeManual(listId, initialName));
      sheetRef.current?.dismiss();
      changeRecipeSheetRef.current?.dismiss();
    };

    const scheduleAutoSave = useCallback(() => {
      if (!mealPlanRecipeToEdit || !selectedRecipe) return;

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        persistChanges();
      }, 350);
    }, [mealPlanRecipeToEdit, persistChanges, selectedRecipe]);

    const flushAutoSave = useCallback(() => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }

      persistChanges();
    }, [persistChanges]);

    useEffect(() => {
      if (!mealPlanRecipeToEdit || !selectedRecipe) return;
      scheduleAutoSave();
    }, [mealPlanRecipeToEdit, scheduleAutoSave, selectedRecipe]);

    const selectedRecipeWithIngredients =
      selectedRecipe &&
      'recipe_ingredients' in selectedRecipe &&
      Array.isArray(selectedRecipe.recipe_ingredients)
        ? (selectedRecipe as RecipeWithIngredients)
        : null;

    const selectedIngredientIds =
      getSelectedSourceIngredientIds(ingredientRows);
    const mealPlanIngredients = useMemo(() => {
      if (!selectedRecipeWithIngredients) return [];

      const ingredientRowsBySourceId = new Map(
        ingredientRows.map(row => [row.sourceRecipeIngredientId, row])
      );

      return selectedRecipeWithIngredients.recipe_ingredients.map(
        ingredient => {
          const row = ingredientRowsBySourceId.get(ingredient.id);
          if (!row) {
            return {
              ...ingredient,
              sourceRecipeIngredientId: ingredient.id,
            };
          }

          return {
            ...ingredient,
            sourceRecipeIngredientId: row.sourceRecipeIngredientId,
            name: row.name,
            quantity: row.quantity,
            unit: row.unit,
            notes: row.notes ?? undefined,
            category: row.category ?? undefined,
          };
        }
      );
    }, [ingredientRows, selectedRecipeWithIngredients]);

    useEffect(() => {
      if (!mealPlanRecipeToEdit || !selectedRecipeWithIngredients) {
        setIngredientRows([]);
        return;
      }

      if (persistedRecipeId !== selectedRecipeWithIngredients.id) {
        // Until the swap is saved, show the new recipe as it will be planned:
        // every ingredient selected, as-is.
        setIngredientRows(
          initializeMealPlanIngredientEditor(
            selectedRecipeWithIngredients.recipe_ingredients
          )
        );
        return;
      }

      let isCancelled = false;

      const loadRows = async () => {
        try {
          const snapshotRows =
            await MealPlanIngredientSnapshotStore.reconcileSnapshot(
              mealPlanRecipeToEdit.id
            );
          if (isCancelled) return;

          setIngredientRows(
            hydrateMealPlanIngredientEditorFromSnapshot({
              sourceIngredients:
                selectedRecipeWithIngredients.recipe_ingredients,
              snapshotRows,
            })
          );
        } catch {
          if (!isCancelled) {
            toast.error('Failed to load meal ingredient selections');
          }
        }
      };

      void loadRows();

      return () => {
        isCancelled = true;
      };
    }, [
      ingredientRowsVersion,
      mealPlanRecipeToEdit,
      persistedRecipeId,
      selectedRecipeWithIngredients,
    ]);

    const handleMealPlanOnlyChange = (nextMealPlanOnly: boolean) => {
      setMealPlanOnly(nextMealPlanOnly, {
        onSuccess: () => setIngredientRowsVersion(version => version + 1),
      });
    };

    const handleToggleIngredientSelection = async (
      sourceRecipeIngredientId: string
    ) => {
      const currentRow = ingredientRows.find(
        row => row.sourceRecipeIngredientId === sourceRecipeIngredientId
      );
      if (!currentRow) return;

      const nextIsSelected = !currentRow.isSelected;
      setIngredientRows(prev =>
        toggleMealPlanIngredientSelection(prev, sourceRecipeIngredientId)
      );

      if (!currentRow.snapshotRowId) return;

      try {
        await MealPlanIngredientSnapshotStore.updateRowSelection({
          snapshotRowId: currentRow.snapshotRowId,
          isSelected: nextIsSelected,
          defaultStore,
        });
      } catch {
        setIngredientRows(prev =>
          prev.map(row =>
            row.sourceRecipeIngredientId === sourceRecipeIngredientId
              ? { ...row, isSelected: currentRow.isSelected }
              : row
          )
        );
        toast.error('Failed to save ingredient selection');
      } finally {
      }
    };

    const handleToggleAllIngredientSelections = async () => {
      if (ingredientRows.length === 0 || !mealPlanRecipeToEdit) return;

      const previousRows = ingredientRows;
      const nextRows = toggleAllMealPlanIngredientSelection(previousRows);
      const nextIsSelected = nextRows[0]?.isSelected ?? true;

      setIngredientRows(nextRows);
      try {
        await MealPlanIngredientSnapshotStore.updateRowsSelection({
          mealPlanRecipeId: mealPlanRecipeToEdit.id,
          selections: previousRows.flatMap(row =>
            row.snapshotRowId
              ? [
                  {
                    snapshotRowId: row.snapshotRowId,
                    isSelected: nextIsSelected,
                  },
                ]
              : []
          ),
          defaultStore,
        });
      } catch {
        setIngredientRows(previousRows);
        toast.error('Failed to save ingredient selections');
      }
    };

    const handleEditIngredient = (sourceRecipeIngredientId: string) => {
      const row = ingredientRows.find(
        ingredientRow =>
          ingredientRow.sourceRecipeIngredientId === sourceRecipeIngredientId
      );
      if (!row) return;
      ingredientOverrideSheetRef.current?.present(row);
    };

    return (
      <>
        <BottomSheet
          name="edit-meal-sheet"
          ref={sheetRef}
          detents={[1]}
          viewClassName="flex-1"
          scrollable
          onStartClose={() => {
            KeyboardController.dismiss();
            flushAutoSave();
          }}
          onDismiss={handleSheetDismiss}
        >
          <BottomSheet.SheetView className="pb-safe flex-1">
            <View className="min-h-0 flex-1">
              <BottomSheet.Header
                title="Edit meal"
                className="mb-2"
                button={
                  selectedRecipe ? (
                    <MealSheetRecipeDropdown
                      recipeId={selectedRecipe.id}
                      recipeName={selectedRecipe.name}
                      onRemove={handleRemoveMeal}
                      onViewRecipe={() => {
                        onDismissRef.current = undefined;
                        router.push(navigation.goToRecipe(selectedRecipe.id));
                        sheetRef.current?.dismiss();
                        changeRecipeSheetRef.current?.dismiss();
                      }}
                      onChangeRecipe={() => {
                        changeRecipeSheetRef.current?.present();
                      }}
                    />
                  ) : undefined
                }
              />
              {selectedRecipeWithIngredients ? (
                <View className="-mx-4 min-h-0 flex-1">
                  <IngredientSelector
                    recipe={selectedRecipeWithIngredients}
                    mode="meal-plan"
                    mealPlanIngredients={mealPlanIngredients}
                    bottomContentInset={24}
                    showHeader={false}
                    recipeNameHeading
                    scheduleControl={
                      <View className="gap-3">
                        <MealScheduleSentence
                          date={selectedDate}
                          onDateChange={setSelectedDate}
                          mealTag={mealTag}
                          onMealTagChange={setMealTag}
                        />
                        <AddToGroceryListSwitch
                          isMealPlanOnly={mealPlanOnly}
                          onMealPlanOnlyChange={handleMealPlanOnlyChange}
                        />
                      </View>
                    }
                    showFooter={false}
                    onBack={() => {}}
                    onDismiss={() => sheetRef.current?.dismiss()}
                    selectedIds={selectedIngredientIds}
                    onToggleIngredient={id => {
                      void handleToggleIngredientSelection(id);
                    }}
                    onToggleAll={() => {
                      void handleToggleAllIngredientSelections();
                    }}
                    onEditIngredient={handleEditIngredient}
                  />
                </View>
              ) : null}
            </View>
          </BottomSheet.SheetView>
        </BottomSheet>

        <MealPlanIngredientOverrideSheet
          ref={ingredientOverrideSheetRef}
          onSave={async ({ sourceRecipeIngredientId, updates }) => {
            const currentRow = ingredientRows.find(
              row => row.sourceRecipeIngredientId === sourceRecipeIngredientId
            );
            if (!currentRow?.snapshotRowId) {
              throw new Error('Snapshot row not found');
            }

            setIngredientRows(prev =>
              prev.map(row =>
                row.sourceRecipeIngredientId === sourceRecipeIngredientId
                  ? applyMealPlanIngredientOverride({ row, updates })
                  : row
              )
            );

            setIsPersistingIngredientOverride(true);
            try {
              await MealPlanIngredientSnapshotStore.updateRowOverrides({
                snapshotRowId: currentRow.snapshotRowId,
                updates,
                defaultStore,
              });
            } catch (error) {
              setIngredientRows(prev =>
                prev.map(row =>
                  row.sourceRecipeIngredientId === sourceRecipeIngredientId
                    ? currentRow
                    : row
                )
              );
              throw error;
            } finally {
              setIsPersistingIngredientOverride(false);
            }
          }}
        />

        <BottomSheet
          name="edit-meal-change-recipe-sheet"
          ref={changeRecipeSheetRef}
          detents={[0.9]}
          scrollable
          viewClassName="flex-1"
          onStartClose={() => {
            KeyboardController.dismiss();
          }}
        >
          <View className="pb-safe flex-1">
            <View className="flex-1 gap-2">
              <BottomSheet.Header title="Choose another recipe" />
              <RecipeSelector
                onSelectRecipe={handleRecipeChange}
                onCreateRecipe={handleCreateRecipe}
                fillHeight
              />
            </View>
          </View>
        </BottomSheet>
      </>
    );
  }
);

EditMealSheet.displayName = 'EditMealSheet';
