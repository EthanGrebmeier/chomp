import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { format, parseISO, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { CalendarIcon } from 'lucide-react-native';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { IngredientSelector } from '../../../components/item-sheet/add-item/ingredient-selector';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { MetaBarLayout } from '../../../components/meta-bar-layout';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { navigation } from '../../../lib/navigation';
import { Recipe, RecipeWithIngredients } from '../../recipes/types';
import { useRemoveRecipeFromMealPlan } from '../hooks/useRemoveRecipeFromMealPlan';
import { useUpdateMealPlanRecipe } from '../hooks/useUpdateMealPlanRecipe';
import { MealPlanIngredientSnapshotStore } from '../instant/meal-plan-ingredient-snapshot-store';
import {
  MealPlanIngredientEditorRow,
  applyMealPlanIngredientOverride,
  getSelectedSourceIngredientIds,
  hydrateMealPlanIngredientEditorFromSnapshot,
  toggleAllMealPlanIngredientSelection,
  toggleMealPlanIngredientSelection,
} from '../meal-plan-recipe-ingredient-editor';
import { MealPlanRecipe } from '../types';

import {
  MealPlanIngredientOverrideSheet,
  MealPlanIngredientOverrideSheetRef,
} from './meal-plan-ingredient-override-sheet';
import { MealPlanRecipeTitle } from './meal-plan-recipe-title';
import { MealSheetRecipeDropdown } from './meal-sheet-recipe-dropdown';
import { MealTimeSheet } from './meal-time-sheet';

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

    const sheetRef = useRef<TrueSheet>(null);
    const changeRecipeSheetRef = useRef<TrueSheet>(null);
    const calendarSheetRef = useRef<CalendarSheetRef>(null);
    const ingredientOverrideSheetRef =
      useRef<MealPlanIngredientOverrideSheetRef>(null);
    const { mutate: updateMealPlanRecipe } = useUpdateMealPlanRecipe();
    const { mutate: removeRecipeFromMealPlan } = useRemoveRecipeFromMealPlan();
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

      removeRecipeFromMealPlan({
        mealPlanRecipeId: mealPlanRecipeToEdit.id,
      });

      resetState();
      sheetRef.current?.dismiss();
    };

    const handleRecipeChange = (recipe: RecipeWithIngredients) => {
      setSelectedRecipe(recipe);
      changeRecipeSheetRef.current?.dismiss();
    };

    const handleCreateRecipe = (initialName?: string) => {
      onDismissRef.current = undefined;
      router.dismissTo(navigation.goToCreateRecipeManual(listId, initialName));
      sheetRef.current?.dismiss();
      calendarSheetRef.current?.dismiss();
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
    }, [mealPlanRecipeToEdit, selectedRecipeWithIngredients]);

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
      if (ingredientRows.length === 0) return;

      const previousRows = ingredientRows;
      const nextRows = toggleAllMealPlanIngredientSelection(previousRows);
      const nextIsSelected = nextRows[0]?.isSelected ?? true;

      setIngredientRows(nextRows);
      try {
        await Promise.all(
          previousRows
            .filter(row => row.snapshotRowId)
            .map(row =>
              MealPlanIngredientSnapshotStore.updateRowSelection({
                snapshotRowId: row.snapshotRowId as string,
                isSelected: nextIsSelected,
              })
            )
        );
      } catch {
        setIngredientRows(previousRows);
        toast.error('Failed to save ingredient selections');
      }
    };

    const footerContent = mealPlanRecipeToEdit ? (
      <View className="bg-background pb-safe border-t border-border px-4 pt-3">
        <MetaBarLayout>
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => calendarSheetRef.current?.present()}>
              <Pill
                hasValue={!!selectedDate}
                icon={<Icon as={CalendarIcon} size={16} />}
              >
                {selectedDate
                  ? startOfDay(
                      parseISO(selectedDate + 'T00:00:00')
                    ).toLocaleDateString()
                  : 'Select Date'}
              </Pill>
            </Pressable>
            <MealTimeSheet onSelect={setMealTag} mealTime={mealTag} />
          </View>
        </MetaBarLayout>
      </View>
    ) : undefined;

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
          footer={footerContent}
        >
          <BottomSheet.SheetView className="pb-safe flex-1">
            <CalendarSheet
              name="edit-meal-calendar-sheet"
              ref={calendarSheetRef}
              headerTitle="Select Date"
              selectedDate={
                selectedDate
                  ? startOfDay(parseISO(selectedDate + 'T00:00:00'))
                  : undefined
              }
              onChange={date => {
                setSelectedDate(format(date, 'yyyy-MM-dd'));
              }}
            />
            <View className="min-h-0 flex-1">
              {selectedRecipe && (
                <BottomSheet.Header
                  title={
                    <MealPlanRecipeTitle
                      name={selectedRecipe.name}
                      className="text-center"
                    />
                  }
                  className="mb-2"
                  button={
                    <MealSheetRecipeDropdown
                      recipeId={selectedRecipe.id}
                      recipeName={selectedRecipe.name}
                      onRemove={handleRemoveMeal}
                      onViewRecipe={() => {
                        onDismissRef.current = undefined;
                        router.push(navigation.goToRecipe(selectedRecipe.id));
                        sheetRef.current?.dismiss();
                        calendarSheetRef.current?.dismiss();
                        changeRecipeSheetRef.current?.dismiss();
                      }}
                      onChangeRecipe={() => {
                        changeRecipeSheetRef.current?.present();
                      }}
                    />
                  }
                />
              )}
              {selectedRecipeWithIngredients ? (
                <View className="-mx-4 min-h-0 flex-1">
                  <IngredientSelector
                    recipe={selectedRecipeWithIngredients}
                    mode="meal-plan"
                    mealPlanIngredients={mealPlanIngredients}
                    bottomContentInset={132}
                    showHeader={false}
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
              <RecipeSelector
                onSelectRecipe={handleRecipeChange}
                onCreateRecipe={handleCreateRecipe}
                listId={listId}
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
