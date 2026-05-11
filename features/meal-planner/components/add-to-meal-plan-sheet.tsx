import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { IngredientSelector } from '../../../components/item-sheet/add-item/ingredient-selector';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { ScrollingMetaBar } from '../../../components/scrolling-meta-bar';
import { Button } from '../../../components/ui/button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { RecipeWithIngredients } from '../../recipes/types';
import { useAddItemToDate } from '../hooks/useAddItemToMealPlan';
import { useAddRecipeToDate } from '../hooks/useAddRecipeToMealPlan';
import {
  applyMealPlanIngredientOverride,
  MealPlanIngredientEditorRow,
  getSelectedSourceIngredientIds,
  initializeMealPlanIngredientEditor,
  toSnapshotCreateInputs,
  toggleAllMealPlanIngredientSelection,
  toggleMealPlanIngredientSelection,
} from '../meal-plan-recipe-ingredient-editor';

import { DatePillSheet } from './date-pill-sheet';
import {
  MealPlanItemProvider,
  useMealPlanItem,
} from './meal-plan-item-context';
import { MealPlanItemForm } from './meal-plan-item-form';
import { MealPlanMetaBar } from './meal-plan-meta-bar';
import {
  MealPlanIngredientOverrideSheet,
  MealPlanIngredientOverrideSheetRef,
} from './meal-plan-ingredient-override-sheet';
import { MealPlanRecipeTitle } from './meal-plan-recipe-title';
import { MealTimeSheet } from './meal-time-sheet';

type AddMode = 'item' | 'recipe';

type ModeToggleProps = {
  mode: AddMode;
  onModeChange: (mode: AddMode) => void;
};

const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <View className="mb-4 flex-row items-center justify-center gap-2">
      <HapticPressable
        onPress={() => onModeChange('recipe')}
        className={cn(
          'rounded-full px-4 py-2',
          mode === 'recipe' ? 'bg-primary' : 'bg-muted'
        )}
        hapticType="light"
      >
        <Text
          className={cn(
            'text-base font-semibold',
            mode === 'recipe'
              ? 'text-primary-foreground'
              : 'text-muted-foreground'
          )}
        >
          Recipe
        </Text>
      </HapticPressable>
      <HapticPressable
        onPress={() => onModeChange('item')}
        className={cn(
          'rounded-full px-4 py-2',
          mode === 'item' ? 'bg-primary' : 'bg-muted'
        )}
        hapticType="light"
      >
        <Text
          className={cn(
            'text-base font-semibold',
            mode === 'item'
              ? 'text-primary-foreground'
              : 'text-muted-foreground'
          )}
        >
          Item
        </Text>
      </HapticPressable>
    </View>
  );
};

type AddToMealPlanSheetProps = {
  listId: string;
  ref?: React.RefObject<AddToMealPlanSheetRef | null>;
};

export type AddToMealPlanSheetRef = {
  present: (options?: { defaultDate?: string }) => void;
  dismiss: () => void;
};

const AddToMealPlanSheetInner = ({ listId, ref }: AddToMealPlanSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const {
    itemName,
    quantity,
    unit,
    category,
    storeId,
    selectedDate,
    setQuantity,
    setUnit,
    setCategory,
    setStoreId,
    setSelectedDate,
    mealTag,
    setMealTag,
    itemNotes,
    resetState: resetMealPlanItemState,
    isValid,
  } = useMealPlanItem();

  const [mode, setMode] = useState<AddMode>('recipe');
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);
  const [ingredientRows, setIngredientRows] = useState<
    MealPlanIngredientEditorRow[]
  >([]);
  const [recipeDate, setRecipeDate] = useState<string | undefined>(undefined);
  const [recipeMealTag, setRecipeMealTag] = useState<string | undefined>(
    undefined
  );
  const ingredientOverrideSheetRef =
    useRef<MealPlanIngredientOverrideSheetRef>(null);

  const { mutate: addItemToDate, isPending: isAddingItem } = useAddItemToDate();
  const { mutate: addRecipeToDate } = useAddRecipeToDate();

  // Expose methods via ref
  if (ref) {
    ref.current = {
      present: (options?: { defaultDate?: string }) => {
        if (options?.defaultDate) {
          setRecipeDate(options.defaultDate);
          setSelectedDate(options.defaultDate);
        }
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    };
  }

  const resetSheetState = () => {
    setMode('recipe');
    setSelectedRecipe(null);
    setIngredientRows([]);
    setRecipeDate(undefined);
    setRecipeMealTag(undefined);
  };

  const handleSelectRecipe = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe);
    setRecipeMealTag(recipe.mealTag ?? undefined);
    setIngredientRows(initializeMealPlanIngredientEditor(recipe.recipe_ingredients));
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
    setIngredientRows([]);
  };

  const handleAddRecipe = () => {
    if (!selectedRecipe || !recipeDate || selectedIngredientIds.size === 0) return;

    addRecipeToDate(
      {
        listId,
        recipeId: selectedRecipe.id,
        date: recipeDate,
        mealTag: recipeMealTag,
        servings: 1,
        ingredientSnapshots: toSnapshotCreateInputs(ingredientRows),
      },
      {
        onSuccess: () => {
          toast.success(`${selectedRecipe.name} added to meal plan`);
          resetSheetState();
          sheetRef.current?.dismiss();
        },
        onError: () => {
          toast.error('Failed to add recipe');
        },
      }
    );
  };

  const handleModeChange = (newMode: AddMode) => {
    setMode(newMode);
    setSelectedRecipe(null);
  };

  const handleItemSuccess = () => {
    sheetRef.current?.dismiss();
  };

  const handleAddItem = () => {
    if (!itemName || !selectedDate) return;

    addItemToDate(
      {
        listId,
        name: itemName,
        quantity,
        unit,
        category,
        storeId,
        date: selectedDate,
        mealTag,
        notes: itemNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`${itemName} added to meal plan`);
          resetMealPlanItemState();
          handleItemSuccess();
        },
        onError: () => {
          toast.error('Failed to add item');
        },
      }
    );
  };

  const isRecipeModeValid = selectedRecipe && recipeDate;
  const selectedIngredientIds = useMemo(
    () => getSelectedSourceIngredientIds(ingredientRows),
    [ingredientRows]
  );
  const mealPlanIngredients = useMemo(() => {
    if (!selectedRecipe) return [];

    const ingredientRowsBySourceId = new Map(
      ingredientRows.map(row => [row.sourceRecipeIngredientId, row])
    );

    return selectedRecipe.recipe_ingredients.map(ingredient => {
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
    });
  }, [ingredientRows, selectedRecipe]);

  const handleToggleIngredient = (sourceRecipeIngredientId: string) => {
    setIngredientRows(prev =>
      toggleMealPlanIngredientSelection(prev, sourceRecipeIngredientId)
    );
  };

  const handleToggleAllIngredients = () => {
    setIngredientRows(prev => toggleAllMealPlanIngredientSelection(prev));
  };

  const handleEditIngredient = (sourceRecipeIngredientId: string) => {
    const row = ingredientRows.find(
      ingredientRow =>
        ingredientRow.sourceRecipeIngredientId === sourceRecipeIngredientId
    );
    if (!row) return;
    ingredientOverrideSheetRef.current?.present(row);
  };

  const isRecipeAddDisabled =
    !isRecipeModeValid || selectedIngredientIds.size === 0;

  const footer =
    mode === 'recipe' && selectedRecipe ? (
      <View className="pb-safe gap-4 px-4">
        <ScrollingMetaBar>
          <DatePillSheet date={recipeDate} onSelect={setRecipeDate} />
          <MealTimeSheet mealTime={recipeMealTag} onSelect={setRecipeMealTag} />
        </ScrollingMetaBar>
        <Button onPress={handleAddRecipe} disabled={isRecipeAddDisabled}>
          <Text>Add to Plan</Text>
        </Button>
      </View>
    ) : mode === 'item' ? (
      <View className="pb-safe gap-4 px-4">
        <MealPlanMetaBar
          date={selectedDate}
          onDateChange={setSelectedDate}
          mealTag={mealTag}
          onMealTagChange={setMealTag}
          quantity={quantity}
          onQuantityChange={setQuantity}
          unit={unit}
          onUnitChange={setUnit}
          category={category}
          onCategoryChange={setCategory}
          storeId={storeId}
          onStoreIdChange={setStoreId}
          onSubmit={handleAddItem}
          isValid={isValid()}
          showAction={false}
        />
        <Button onPress={handleAddItem} disabled={!isValid() || isAddingItem}>
          <Text>Add Item</Text>
        </Button>
      </View>
    ) : null;

  return (
    <BottomSheet
      name="add-to-meal-plan-sheet"
      ref={sheetRef}
      detents={[1]}
      scrollable={mode === 'recipe'}
      viewClassName="flex-1 pb-safe"
      onStartClose={() => {
        KeyboardController.dismiss();
        resetMealPlanItemState();
        resetSheetState();
      }}
      footer={footer ?? undefined}
    >
      {!selectedRecipe && (
        <ModeToggle mode={mode} onModeChange={handleModeChange} />
      )}

      <View className={mode === 'recipe' ? 'min-h-0 flex-1' : undefined}>
        {mode === 'recipe' ? (
          selectedRecipe ? (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(150)}
              className="min-h-0 flex-1"
            >
              <IngredientSelector
                recipe={selectedRecipe}
                mode="meal-plan"
                mealPlanIngredients={mealPlanIngredients}
                onBack={handleBackToRecipes}
                onDismiss={() => sheetRef.current?.dismiss()}
                onToggleIngredient={handleToggleIngredient}
                onToggleAll={handleToggleAllIngredients}
                selectedIds={selectedIngredientIds}
                onEditIngredient={handleEditIngredient}
                headerTitle={
                  <MealPlanRecipeTitle
                    name={selectedRecipe.name}
                    className="text-center"
                  />
                }
              />
            </Animated.View>
          ) : (
            <RecipeSelector
              onSelectRecipe={handleSelectRecipe}
              onDismiss={() => sheetRef.current?.dismiss()}
            />
          )
        ) : (
          <View className="px-4">
            <MealPlanItemForm onSubmit={handleAddItem} showMetaBar={false} />
          </View>
        )}
      </View>
      <MealPlanIngredientOverrideSheet
        ref={ingredientOverrideSheetRef}
        onSave={async ({ sourceRecipeIngredientId, updates }) => {
          setIngredientRows(prev =>
            prev.map(row =>
              row.sourceRecipeIngredientId === sourceRecipeIngredientId
                ? applyMealPlanIngredientOverride({ row, updates })
                : row
            )
          );
        }}
      />
    </BottomSheet>
  );
};

export const AddToMealPlanSheet = ({
  listId,
  ref,
}: AddToMealPlanSheetProps) => {
  return (
    <MealPlanItemProvider initialValues={{ selectedDate: undefined }}>
      <AddToMealPlanSheetInner listId={listId} ref={ref} />
    </MealPlanItemProvider>
  );
};
