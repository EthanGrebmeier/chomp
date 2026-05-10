import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { ScrollingMetaBar } from '../../../components/scrolling-meta-bar';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { ExternalLinkButton } from '../../../components/ui/external-link-button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { RecipeCardContent } from '../../recipes/components/recipe-card';
import { RecipeWithIngredients } from '../../recipes/types';
import { useAddItemToDate } from '../hooks/useAddItemToMealPlan';
import { useAddRecipeToDate } from '../hooks/useAddRecipeToMealPlan';

import { DatePillSheet } from './date-pill-sheet';
import {
  MealPlanItemProvider,
  useMealPlanItem,
} from './meal-plan-item-context';
import { MealPlanItemForm } from './meal-plan-item-form';
import { MealPlanMetaBar } from './meal-plan-meta-bar';
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
  const [recipeDate, setRecipeDate] = useState<string | undefined>(undefined);
  const [recipeMealTag, setRecipeMealTag] = useState<string | undefined>(
    undefined
  );

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
    setRecipeDate(undefined);
    setRecipeMealTag(undefined);
  };

  const handleSelectRecipe = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe);
    setRecipeMealTag(recipe.mealTag ?? undefined);
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
  };

  const handleAddRecipe = () => {
    if (!selectedRecipe || !recipeDate) return;

    addRecipeToDate(
      {
        listId,
        recipeId: selectedRecipe.id,
        date: recipeDate,
        mealTag: recipeMealTag,
        servings: 1,
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

  const handleGoToRecipe = () => {
    if (!selectedRecipe) return;
    sheetRef.current?.dismiss();
    router.push(`/recipes/${selectedRecipe.id}`);
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

  const footerContent =
    mode === 'recipe' && selectedRecipe ? (
      <View className="pb-safe gap-4 px-4">
        <ScrollingMetaBar>
          <DatePillSheet date={recipeDate} onSelect={setRecipeDate} />
          <MealTimeSheet mealTime={recipeMealTag} onSelect={setRecipeMealTag} />
        </ScrollingMetaBar>
        <Button onPress={handleAddRecipe} disabled={!isRecipeModeValid}>
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
      scrollable={mode === 'recipe' && !selectedRecipe}
      viewClassName="pb-safe"
      onStartClose={() => {
        KeyboardController.dismiss();
        resetMealPlanItemState();
        resetSheetState();
      }}
      footer={footerContent ?? undefined}
    >
      {!selectedRecipe && (
        <ModeToggle mode={mode} onModeChange={handleModeChange} />
      )}

      {mode === 'recipe' ? (
        selectedRecipe ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            className="px-4"
          >
            <BottomSheet.Header
              title="Add Recipe"
              dismissButton={<BackButton onPress={handleBackToRecipes} />}
              button={
                <ExternalLinkButton onPress={handleGoToRecipe} />
              }
            />
            <View className="gap-4">
              <RecipeCardContent
                name={selectedRecipe.name}
                ingredientCount={selectedRecipe.recipe_ingredients.length}
                className="w-full"
              />

              <View>
                <Text className="text-base font-bold text-foreground">
                  Ingredients
                </Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {selectedRecipe.recipe_ingredients.map(ingredient => (
                    <View
                      key={ingredient.id}
                      className="flex-row items-center justify-between"
                    >
                      <Text className="text-base font-medium text-foreground">
                        {ingredient.name}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {formatQuantityUnit(
                          ingredient.quantity,
                          ingredient.unit
                        )}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
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
