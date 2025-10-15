import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';

import { Pressable, View } from 'react-native';
import { BottomSheet } from '../../../components/bottom-sheet';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';

import { PencilIcon } from 'lucide-react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { RecipeSearch } from '../../recipes/components/recipe-search';
import { RecipeWithIngredients } from '../../recipes/types';
import { useAddRecipeToMealPlan } from '../hooks/useAddRecipeToMealPlan';
import { MealTag } from '../types';
import { MealTimeSelector } from './meal-time-selector';

type AddMealSheetProps = {
  mealPlanId: string;
  date: string;
};

export const AddMealSheet = ({ mealPlanId, date }: AddMealSheetProps) => {
  const [currentView, setCurrentView] = useState<'search' | 'recipe'>('search');
  const [canGoBack, setCanGoBack] = useState(false);
  const [mealTag, setMealTag] = useState<MealTag | undefined>(undefined);
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);
  const ref = useRef<BottomSheetModal>(null);
  const handleOpen = () => {
    ref.current?.present();
  };
  const { mutate: addRecipeToMealPlan } = useAddRecipeToMealPlan();

  const resetState = () => {
    setSelectedRecipe(null);
    setCanGoBack(false);
    setCurrentView('search');
    setMealTag(undefined);
  };

  const handleAddRecipeToMealPlan = () => {
    if (!selectedRecipe) return;
    addRecipeToMealPlan({
      mealPlanId,
      recipeId: selectedRecipe.id,
      mealTag,
      date,
    });
    resetState();
  };

  return (
    <>
      <Button onPress={handleOpen}>
        <Text>Add Meal</Text>
      </Button>
      <BottomSheet
        ref={ref}
        onStartClose={() => {
          KeyboardController.dismiss();
          resetState();
        }}
        onOpen={handleOpen}
      >
        {currentView === 'search' ? (
          <RecipeSearch
            canGoBack={canGoBack}
            onItemSelect={recipe => {
              setSelectedRecipe(recipe);
              setCurrentView('recipe');
              setCanGoBack(true);
            }}
            onBack={() => {
              setCurrentView('recipe');
            }}
          />
        ) : (
          <View>
            <BottomSheet.Header
              title="Add Meal"
              button={
                !selectedRecipe ? (
                  <Pressable onPress={() => setCurrentView('search')}>
                    <Text className="text-sm font-bold text-foreground">
                      Add From Recipes
                    </Text>
                  </Pressable>
                ) : null
              }
            />
            <View className="gap-2">
              {selectedRecipe && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-semibold text-foreground">
                    {selectedRecipe?.name}
                  </Text>
                  <Pressable onPress={() => setCurrentView('search')}>
                    <PencilIcon size={16} />
                  </Pressable>
                </View>
              )}
              <View className="gap-4 border-t border-border pt-2">
                <MealTimeSelector onSelect={setMealTag} mealTime={mealTag} />
                <Button onPress={handleAddRecipeToMealPlan}>
                  <Text>Add Meal</Text>
                </Button>
              </View>
            </View>
          </View>
        )}
      </BottomSheet>
    </>
  );
};
