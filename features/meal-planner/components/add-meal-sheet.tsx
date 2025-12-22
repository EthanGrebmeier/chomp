import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ArrowLeftIcon } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../../../components/bottom-sheet';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
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
        onStartClose={() => {
          KeyboardController.dismiss();
          resetState();
        }}
      >
        <BottomSheet.SheetView>
          {selectedRecipe ? (
            <View>
              <Pressable
                onPress={handleBackToRecipes}
                className="mb-4 flex-row items-center gap-2"
              >
                <Icon as={ArrowLeftIcon} size={16} />
                <Text className="text-sm font-bold text-foreground">Back</Text>
              </Pressable>
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
            </View>
          ) : (
            <RecipeSelector
              onSelectRecipe={handleSelectRecipe}
              onDismiss={() => sheetRef.current?.dismiss()}
            />
          )}
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

AddMealSheet.displayName = 'AddMealSheet';
