import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { eachDayOfInterval } from 'date-fns';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import { Pressable, View } from 'react-native';
import { BottomSheet } from '../../../components/bottom-sheet';
import { Button } from '../../../components/ui/button';
import { DateSelector } from '../../../components/ui/date-selector';
import { Text } from '../../../components/ui/text';

import { PencilIcon, TrashIcon } from 'lucide-react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { RecipeSearch } from '../../recipes/components/recipe-search';
import { Recipe } from '../../recipes/types';
import { useAddRecipeToMealPlan } from '../hooks/useAddRecipeToMealPlan';
import { useRemoveRecipeFromMealPlan } from '../hooks/useRemoveRecipeFromMealPlan';
import { useUpdateMealPlanRecipe } from '../hooks/useUpdateMealPlanRecipe';
import { MealPlanRecipe, MealTag } from '../types';
import { MealTimeSelector } from './meal-time-selector';

type MealSheetProps = {
  mealPlanId: string;
  startDate: string;
  endDate: string;
};

export type MealSheetRef = {
  openForAdd: ({ date }: { date: string }) => void;
  openForEdit: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipe;
    recipe: Recipe;
  }) => void;
};

export const MealSheet = forwardRef<MealSheetRef, MealSheetProps>(
  (props, ref) => {
    // State management
    const [mode, setMode] = useState<'add' | 'edit'>('add');
    const [currentView, setCurrentView] = useState<'search' | 'recipe'>(
      'search'
    );
    const [canGoBack, setCanGoBack] = useState(false);
    const [mealTag, setMealTag] = useState<MealTag | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(
      undefined
    );
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [mealPlanRecipeToEdit, setMealPlanRecipeToEdit] =
      useState<MealPlanRecipe | null>(null);

    const sheetRef = useRef<BottomSheetModal>(null);

    // Computed values
    const daysOfPlan = eachDayOfInterval({
      start: props.startDate,
      end: props.endDate,
    });

    // Hooks
    const { mutate: addRecipeToMealPlan } = useAddRecipeToMealPlan();
    const { mutate: updateMealPlanRecipe } = useUpdateMealPlanRecipe();
    const { mutate: removeRecipeFromMealPlan } = useRemoveRecipeFromMealPlan();

    // Imperative handle
    useImperativeHandle(ref, () => ({
      openForAdd: ({ date }: { date: string }) => {
        setMode('add');
        setSelectedDate(date);
        setSelectedRecipe(null);
        setMealPlanRecipeToEdit(null);
        setMealTag(undefined);
        setCurrentView('search');
        setCanGoBack(false);
        sheetRef.current?.present();
      },
      openForEdit: ({
        mealPlanRecipe,
        recipe,
      }: {
        mealPlanRecipe: MealPlanRecipe;
        recipe: Recipe;
      }) => {
        setMode('edit');
        setSelectedDate(mealPlanRecipe.date);
        setSelectedRecipe(recipe);
        setMealPlanRecipeToEdit(mealPlanRecipe);
        setMealTag(mealPlanRecipe.mealTag ?? undefined);
        setCurrentView('recipe');
        setCanGoBack(true);
        sheetRef.current?.present();
      },
    }));

    const resetState = () => {
      setSelectedRecipe(null);
      setSelectedDate(undefined);
      setCanGoBack(false);
      setCurrentView('search');
      setMealTag(undefined);
      setMealPlanRecipeToEdit(null);
    };

    const handleAddRecipeToMealPlan = () => {
      if (!selectedRecipe || !selectedDate || mode !== 'add') return;
      addRecipeToMealPlan({
        mealPlanId: props.mealPlanId,
        recipeId: selectedRecipe.id,
        mealTag,
        date: selectedDate,
      });
      resetState();
    };

    const handleUpdateMealPlanRecipe = () => {
      if (!selectedRecipe || !mealPlanRecipeToEdit || mode !== 'edit') return;
      updateMealPlanRecipe({
        mealPlanRecipeId: mealPlanRecipeToEdit.id,
        updates: {
          recipeId: selectedRecipe.id,
          mealTag,
          servings: selectedRecipe.servings ?? undefined,
          date: selectedDate,
        },
      });
      resetState();
      sheetRef.current?.close();
    };

    const handleRemoveMeal = () => {
      if (!mealPlanRecipeToEdit || mode !== 'edit') return;
      removeRecipeFromMealPlan({
        mealPlanRecipeId: mealPlanRecipeToEdit.id,
      });
      resetState();
      sheetRef.current?.close();
    };

    const handleSubmit = () => {
      if (mode === 'add') {
        handleAddRecipeToMealPlan();
      } else {
        handleUpdateMealPlanRecipe();
      }
    };

    const recipeToDisplay = selectedRecipe;

    return (
      <BottomSheet
        ref={sheetRef}
        onStartClose={() => {
          KeyboardController.dismiss();
          resetState();
        }}
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
              title={mode === 'add' ? 'Add Meal' : 'Update Meal'}
              button={
                mode === 'add' && !selectedRecipe ? (
                  <Pressable onPress={() => setCurrentView('search')}>
                    <Text className="text-sm font-bold text-foreground">
                      Add From Recipes
                    </Text>
                  </Pressable>
                ) : mode === 'edit' ? (
                  <Pressable onPress={handleRemoveMeal}>
                    <TrashIcon size={20} color="#ef4444" />
                  </Pressable>
                ) : null
              }
            />
            <View className="gap-4">
              {recipeToDisplay && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-semibold text-foreground">
                    {recipeToDisplay?.name}
                  </Text>
                  <Pressable onPress={() => setCurrentView('search')}>
                    <PencilIcon size={16} />
                  </Pressable>
                </View>
              )}

              <View className="gap-4 border-t border-border pt-2">
                <View className="flex-row items-center gap-2">
                  <DateSelector
                    daysOfPlan={daysOfPlan}
                    date={selectedDate}
                    onSelect={date => {
                      setSelectedDate(date);
                      setCurrentView('recipe');
                    }}
                    onClear={() => setSelectedDate(undefined)}
                  />
                  <MealTimeSelector onSelect={setMealTag} mealTime={mealTag} />
                </View>
                <Button onPress={handleSubmit}>
                  <Text>{mode === 'add' ? 'Add Meal' : 'Update Meal'}</Text>
                </Button>
              </View>
            </View>
          </View>
        )}
      </BottomSheet>
    );
  }
);
