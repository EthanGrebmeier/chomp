import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, View, useWindowDimensions } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { SHEET_TOP_STYLE, SheetContent } from '@/components/sheet-content';
import { isStoreReviewCancelled } from '@/features/quantity/store-review-cancelled';

import { BottomSheet } from '../../../components/bottom-sheet';
import { IngredientSelector } from '../../../components/item-sheet/add-item/ingredient-selector';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { BackButton } from '../../../components/ui/back-button';
import { navigation } from '../../../lib/navigation';
import { THEME } from '../../../lib/theme';
import { Recipe, RecipeWithIngredients } from '../../recipes/types';
import { useDefaultStore } from '../../stores/instant/use-default-store';
import { useRemoveRecipeFromMealPlan } from '../hooks/useRemoveRecipeFromMealPlan';
import { useUpdateMealPlanRecipe } from '../hooks/useUpdateMealPlanRecipe';
import { useUserMealPlanData } from '../hooks/useUserMealPlanData';
import { MealPlanIngredientSnapshotStore } from '../instant/meal-plan-ingredient-snapshot-store';
import {
  MealPlanIngredientEditorRow,
  getSelectedSourceIngredientIds,
  hydrateMealPlanIngredientEditorFromSnapshot,
  initializeMealPlanIngredientEditor,
} from '../meal-plan-recipe-ingredient-editor';
import { MealPlanRecipe } from '../types';
import { SerializedAutosave } from '../utils/serialized-autosave';
import {
  getCanonicalSnapshots,
  getIngredientShoppingStatus,
} from '../utils/shopping-state';
import {
  countUncheckedLinkedGroceryItems,
  withUncheckedLinkedGroceryItemsNotice,
} from '../utils/unchecked-linked-grocery-items';

import {
  MealPlanIngredientOverrideSheet,
  MealPlanIngredientOverrideSheetRef,
} from './meal-plan-ingredient-override-sheet';
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
    focusSourceId?: string;
  }) => void;
};

export const EditMealSheet = forwardRef<EditMealSheetRef, EditMealSheetProps>(
  ({ listId }, ref) => {
    const { height: windowHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const backgroundColor =
      THEME[colorScheme === 'dark' ? 'dark' : 'light'].background;
    const expandedHeight = Math.min(
      windowHeight * 0.94,
      windowHeight - insets.top - 12
    );
    const [mealTag, setMealTag] = useState<string | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(
      undefined
    );
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [pendingSelections, setPendingSelections] = useState<
      Record<string, boolean>
    >({});
    const [isSavingSelection, setIsSavingSelection] = useState(false);
    const selectionInFlightRef = useRef(false);
    const editorSessionRef = useRef(0);
    const [isSnapshotLoading, setIsSnapshotLoading] = useState(true);
    const [mealPlanRecipeToEdit, setMealPlanRecipeToEdit] =
      useState<MealPlanRecipe | null>(null);
    // Recipe the entry is linked to in the database. Swapping recipes replaces
    // the ingredient snapshots once saved, so rows load only after that.
    const [persistedRecipeId, setPersistedRecipeId] = useState<string | null>(
      null
    );

    const [focusedSourceId, setFocusedSourceId] = useState<
      string | undefined
    >();
    const [sheetOpen, setSheetOpen] = useState(false);
    const sheetRef = useRef<TrueSheet>(null);
    const changeRecipeSheetRef = useRef<TrueSheet>(null);
    const ingredientOverrideSheetRef =
      useRef<MealPlanIngredientOverrideSheetRef>(null);
    const { mutateAsync: updateMealPlanRecipe } = useUpdateMealPlanRecipe();
    const { data: defaultStore } = useDefaultStore();
    const { mutate: removeRecipeFromMealPlan } = useRemoveRecipeFromMealPlan();
    // Shared with the planner view, so the entry's linked items stay live.
    const { recipes: mealPlanRecipes } = useUserMealPlanData(listId);
    const liveMealPlanRecipe = mealPlanRecipeToEdit
      ? mealPlanRecipes.find(recipe => recipe.id === mealPlanRecipeToEdit.id)
      : undefined;
    const [autosave] = useState(() => new SerializedAutosave());
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
      void autosave
        .save(snapshot, async () => {
          await updateMealPlanRecipe({
            mealPlanRecipeId: mealPlanRecipeToEdit.id,
            updates: {
              recipeId: selectedRecipe.id,
              mealTag,
              date: selectedDate,
            },
          });
          setPersistedRecipeId(selectedRecipe.id);
        })
        .catch(error => {
          if (!isStoreReviewCancelled(error))
            toast.error('Failed to update meal');
        });
    }, [
      autosave,
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
        focusSourceId,
      }: {
        mealPlanRecipe: MealPlanRecipe;
        recipe: Recipe;
        onDismiss?: () => void;
        focusSourceId?: string;
      }) => {
        setFocusedSourceId(focusSourceId);
        setSheetOpen(false);
        editorSessionRef.current += 1;
        selectionInFlightRef.current = false;
        setPendingSelections({});
        setIsSavingSelection(false);
        setIsSnapshotLoading(true);
        setSelectedDate(mealPlanRecipe.date);
        setSelectedRecipe(recipe);
        setMealPlanRecipeToEdit(mealPlanRecipe);
        setPersistedRecipeId(recipe.id);
        setMealTag(mealPlanRecipe.mealTag ?? undefined);
        onDismissRef.current = onDismiss;
        autosave.reset(
          getSnapshot(
            recipe.id,
            mealPlanRecipe.mealTag ?? undefined,
            mealPlanRecipe.date
          )
        );
        changeRecipeSheetRef.current?.dismiss();
        sheetRef.current?.present();
      },
    }));

    const resetState = () => {
      editorSessionRef.current += 1;
      setPendingSelections({});
      selectionInFlightRef.current = false;
      setIsSavingSelection(false);
      setSelectedRecipe(null);
      setSelectedDate(undefined);
      setMealTag(undefined);
      setMealPlanRecipeToEdit(null);
      setPersistedRecipeId(null);
      void autosave.stop();
      changeRecipeSheetRef.current?.dismiss();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };

    const handleSheetDismiss = async () => {
      const session = editorSessionRef.current;
      await autosave.flush();
      if (session !== editorSessionRef.current) return;
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
            onPress: async () => {
              await autosave.stop();
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
      return () => {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      };
    }, [mealPlanRecipeToEdit, scheduleAutoSave, selectedRecipe]);

    const selectedRecipeWithIngredients =
      liveMealPlanRecipe && liveMealPlanRecipe.recipe.id === selectedRecipe?.id
        ? liveMealPlanRecipe.recipe
        : selectedRecipe &&
            'recipe_ingredients' in selectedRecipe &&
            Array.isArray(selectedRecipe.recipe_ingredients)
          ? (selectedRecipe as RecipeWithIngredients)
          : null;
    const ingredientRows = useMemo<MealPlanIngredientEditorRow[]>(() => {
      if (!selectedRecipeWithIngredients) return [];
      const rows =
        persistedRecipeId === selectedRecipeWithIngredients.id &&
        liveMealPlanRecipe
          ? hydrateMealPlanIngredientEditorFromSnapshot({
              sourceIngredients:
                selectedRecipeWithIngredients.recipe_ingredients,
              snapshotRows: liveMealPlanRecipe.ingredient_snapshots ?? [],
            })
          : initializeMealPlanIngredientEditor(
              selectedRecipeWithIngredients.recipe_ingredients
            );
      return rows.map(row =>
        pendingSelections[row.sourceRecipeIngredientId] !== undefined
          ? {
              ...row,
              isSelected: pendingSelections[row.sourceRecipeIngredientId],
            }
          : row
      );
    }, [
      liveMealPlanRecipe,
      pendingSelections,
      persistedRecipeId,
      selectedRecipeWithIngredients,
    ]);
    useEffect(() => {
      if (!focusedSourceId || !sheetOpen || isSnapshotLoading) return;
      const row = ingredientRows.find(i => i.snapshotRowId === focusedSourceId);
      if (!row) return;
      ingredientOverrideSheetRef.current?.present(row);
      setFocusedSourceId(undefined);
    }, [focusedSourceId, sheetOpen, isSnapshotLoading, ingredientRows]);
    const shoppingStatusBySource = new Map(
      getCanonicalSnapshots(
        selectedRecipeWithIngredients?.recipe_ingredients ?? [],
        liveMealPlanRecipe?.ingredient_snapshots ?? []
      ).map(row => [
        row.sourceRecipeIngredientId,
        getIngredientShoppingStatus(row.grocery_item),
      ])
    );
    const selectionDisabled =
      isSnapshotLoading ||
      isSavingSelection ||
      persistedRecipeId !== selectedRecipe?.id;
    const isRowSelectable = (row: MealPlanIngredientEditorRow) =>
      !selectionDisabled &&
      !!row.snapshotRowId &&
      shoppingStatusBySource.get(row.sourceRecipeIngredientId) !==
        'purchased' &&
      shoppingStatusBySource.get(row.sourceRecipeIngredientId) !== 'removed';

    const selectedIngredientIds =
      getSelectedSourceIngredientIds(ingredientRows);
    const mealPlanIngredients = (() => {
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
              selectionDisabled: true,
            };
          }

          return {
            ...ingredient,
            sourceRecipeIngredientId: row.sourceRecipeIngredientId,
            shoppingStatus: shoppingStatusBySource.get(
              row.sourceRecipeIngredientId
            ),
            selectionDisabled: !isRowSelectable(row),
            name: row.name,
            quantity: row.quantity,
            unit: row.unit,
            notes: row.notes ?? undefined,
            category: row.category ?? undefined,
          };
        }
      );
    })();

    useEffect(() => {
      if (!mealPlanRecipeToEdit || !persistedRecipeId) return;
      let isCancelled = false;
      setIsSnapshotLoading(true);
      // Backfill once per entry/recipe. Ongoing reads come from the live query.
      void MealPlanIngredientSnapshotStore.reconcileSnapshot(
        mealPlanRecipeToEdit.id
      )
        .then(() => {
          if (!isCancelled) setIsSnapshotLoading(false);
        })
        .catch(() => {
          if (!isCancelled)
            toast.error('Failed to load meal ingredient selections');
        });
      return () => {
        isCancelled = true;
      };
    }, [mealPlanRecipeToEdit, persistedRecipeId]);

    const handleToggleIngredientSelection = async (
      sourceRecipeIngredientId: string
    ) => {
      const currentRow = ingredientRows.find(
        row => row.sourceRecipeIngredientId === sourceRecipeIngredientId
      );
      if (
        !currentRow?.snapshotRowId ||
        !isRowSelectable(currentRow) ||
        selectionInFlightRef.current
      )
        return;
      const session = editorSessionRef.current;
      selectionInFlightRef.current = true;
      setIsSavingSelection(true);
      const nextIsSelected = !currentRow.isSelected;
      setPendingSelections({ [sourceRecipeIngredientId]: nextIsSelected });
      try {
        await MealPlanIngredientSnapshotStore.updateRowSelection({
          snapshotRowId: currentRow.snapshotRowId,
          isSelected: nextIsSelected,
          defaultStore,
        });
      } catch (error) {
        if (
          session === editorSessionRef.current &&
          !isStoreReviewCancelled(error)
        )
          toast.error('Failed to save ingredient selection');
      } finally {
        if (session === editorSessionRef.current) {
          setPendingSelections({});
          selectionInFlightRef.current = false;
          setIsSavingSelection(false);
        }
      }
    };

    const handleToggleAllIngredientSelections = async () => {
      if (!mealPlanRecipeToEdit || selectionInFlightRef.current) return;
      const eligibleRows = ingredientRows.filter(isRowSelectable);
      if (eligibleRows.length === 0) return;
      const nextIsSelected = eligibleRows.some(row => !row.isSelected);
      const session = editorSessionRef.current;
      selectionInFlightRef.current = true;
      setIsSavingSelection(true);
      setPendingSelections(
        Object.fromEntries(
          eligibleRows.map(row => [
            row.sourceRecipeIngredientId,
            nextIsSelected,
          ])
        )
      );
      try {
        await MealPlanIngredientSnapshotStore.updateRowsSelection({
          mealPlanRecipeId: mealPlanRecipeToEdit.id,
          selections: eligibleRows.map(row => ({
            snapshotRowId: row.snapshotRowId!,
            isSelected: nextIsSelected,
          })),
          defaultStore,
        });
      } catch (error) {
        if (
          session === editorSessionRef.current &&
          !isStoreReviewCancelled(error)
        )
          toast.error('Failed to save ingredient selections');
      } finally {
        if (session === editorSessionRef.current) {
          setPendingSelections({});
          selectionInFlightRef.current = false;
          setIsSavingSelection(false);
        }
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
        <TrueSheet
          name="edit-meal-sheet"
          onDidPresent={() => setSheetOpen(true)}
          ref={sheetRef}
          detents={[expandedHeight / windowHeight]}
          backgroundColor={backgroundColor}
          insetAdjustment="never"
          grabber
          scrollable
          onWillDismiss={flushAutoSave}
          onDidDismiss={handleSheetDismiss}
        >
          <SheetContent
            style={{ height: expandedHeight, ...SHEET_TOP_STYLE }}
            className="pb-6"
          >
            <View className="min-h-0 flex-1">
              <BottomSheet.Header
                title="Edit meal"
                backAction={
                  <BackButton onPress={() => sheetRef.current?.dismiss()} />
                }
                primaryAction={
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
                <View className="-mx-8 min-h-0 flex-1">
                  <IngredientSelector
                    recipe={selectedRecipeWithIngredients}
                    mode="meal-plan"
                    mealPlanIngredients={mealPlanIngredients}
                    bottomContentInset={24}
                    showHeader={false}
                    recipeNameHeading
                    scheduleControl={
                      <MealScheduleSentence
                        date={selectedDate}
                        onDateChange={setSelectedDate}
                        mealTag={mealTag}
                        onMealTagChange={setMealTag}
                      />
                    }
                    showFooter={false}
                    onBack={() => {}}
                    onDismiss={() => sheetRef.current?.dismiss()}
                    selectedIds={selectedIngredientIds}
                    selectionDisabled={selectionDisabled}
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
          </SheetContent>
        </TrueSheet>

        <MealPlanIngredientOverrideSheet
          ref={ingredientOverrideSheetRef}
          onSave={async ({ sourceRecipeIngredientId, updates }) => {
            const currentRow = ingredientRows.find(
              row => row.sourceRecipeIngredientId === sourceRecipeIngredientId
            );
            if (!currentRow?.snapshotRowId) {
              throw new Error('Snapshot row not found');
            }

            await MealPlanIngredientSnapshotStore.updateRowOverrides({
              snapshotRowId: currentRow.snapshotRowId,
              updates,
              defaultStore,
            });
          }}
        />

        <BottomSheet
          name="edit-meal-change-recipe-sheet"
          ref={changeRecipeSheetRef}
          detents={[0.9]}
          insetAdjustment="never"
          scrollable
          viewClassName="flex-1"
          onStartClose={() => {
            KeyboardController.dismiss();
          }}
        >
          <View className="flex-1">
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
