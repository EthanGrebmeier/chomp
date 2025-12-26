import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BottomSheet } from '../../../components/bottom-sheet';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { RecipeWithIngredients } from '../../recipes/types';
import { useAddRecipeToMealPlan } from '../hooks/useAddRecipeToMealPlan';

import { MealTimeSheet } from './meal-time-sheet';

type AddMealSheetProps = {
  mealPlanId: string;
};

export type AddMealSheetRef = {
  open: ({ date }: { date: string }) => void;
};

export const AddMealSheet = forwardRef<AddMealSheetRef, AddMealSheetProps>(
  (props, ref) => {
    const [mealTag, setMealTag] = useState<string | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(
      undefined
    );
    const [selectedRecipe, setSelectedRecipe] =
      useState<RecipeWithIngredients | null>(null);

    const sheetRef = useRef<TrueSheet>(null);
    const { mutate: addRecipeToMealPlan } = useAddRecipeToMealPlan();

    useImperativeHandle(ref, () => ({
      open: ({ date }: { date: string }) => {
        setSelectedDate(date);
        sheetRef.current?.present();
      },
    }));

    const resetState = () => {
      setSelectedDate(undefined);
      setMealTag(undefined);
      setSelectedRecipe(null);
    };

    const handleSelectRecipe = (recipe: RecipeWithIngredients) => {
      setSelectedRecipe(recipe);
      setMealTag(recipe.mealTag ?? undefined);
    };

    const handleBackToRecipes = () => {
      setSelectedRecipe(null);
    };

    const handleAddMeal = () => {
      if (!selectedDate || !selectedRecipe) return;

      addRecipeToMealPlan({
        mealPlanId: props.mealPlanId,
        recipeId: selectedRecipe.id,
        mealTag,
        date: selectedDate,
      });

      resetState();
      sheetRef.current?.dismiss();
    };

    return (
      <BottomSheet
        name="add-meal-sheet"
        ref={sheetRef}
        detents={selectedRecipe ? ['auto'] : [0.7]}
        scrollable={!selectedRecipe}
        onStartClose={() => {
          KeyboardController.dismiss();
          resetState();
        }}
      >
        {selectedRecipe ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            className="px-4"
          >
            <View className="mb-4">
              <BackButton onPress={handleBackToRecipes} />
            </View>
            <View className="gap-4">
              <Text className="text-2xl font-semibold text-foreground">
                {selectedRecipe.name}
              </Text>
              <View className="flex-row items-center justify-between">
                <MealTimeSheet mealTime={mealTag} onSelect={setMealTag} />
                <Button onPress={handleAddMeal}>
                  <Text>Add Meal</Text>
                </Button>
              </View>
            </View>
          </Animated.View>
        ) : (
          <>
            <BottomSheet.Header className="px-4" title="Add Meal" />
            <RecipeSelector
              onSelectRecipe={handleSelectRecipe}
              onDismiss={() => sheetRef.current?.dismiss()}
            />
          </>
        )}
      </BottomSheet>
    );
  }
);

AddMealSheet.displayName = 'AddMealSheet';
