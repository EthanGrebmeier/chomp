import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { format, parseISO, startOfDay } from 'date-fns';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import { Pressable, View } from 'react-native';
import { BottomSheet } from '../../../components/bottom-sheet';
import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';

import { router } from 'expo-router';
import { CalendarIcon } from 'lucide-react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { useTheme } from '../../../hooks/use-theme';
import { navigation } from '../../../lib/navigation';
import { RecipeSearch } from '../../recipes/components/recipe-search';
import { Recipe } from '../../recipes/types';
import { useAddRecipeToMealPlan } from '../hooks/useAddRecipeToMealPlan';
import { useRemoveRecipeFromMealPlan } from '../hooks/useRemoveRecipeFromMealPlan';
import { useUpdateMealPlanRecipe } from '../hooks/useUpdateMealPlanRecipe';
import { MealPlanRecipe, MealTag } from '../types';
import { MealSheetRecipeDropdown } from './meal-sheet-recipe-dropdown';
import { MealTimeSelector } from './meal-time-selector';

type MealSheetProps = {
  mealPlanId: string;
  startDate: string;
  endDate: string;
};

export type MealSheetRef = {
  openForAdd: ({ date, mealTime }: { date: string; mealTime: MealTag }) => void;
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

    const sheetRef = useRef<TrueSheet>(null);
    const calendarSheetRef = useRef<CalendarSheetRef>(null);
    const theme = useTheme();
    // Hooks
    const { mutate: addRecipeToMealPlan } = useAddRecipeToMealPlan();
    const { mutate: updateMealPlanRecipe } = useUpdateMealPlanRecipe();
    const { mutate: removeRecipeFromMealPlan } = useRemoveRecipeFromMealPlan();

    // Imperative handle
    useImperativeHandle(ref, () => ({
      openForAdd: ({ date, mealTime }: { date: string; mealTime: MealTag }) => {
        setMode('add');
        setSelectedDate(date);
        setSelectedRecipe(null);
        setMealPlanRecipeToEdit(null);
        setMealTag(mealTime);
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
          servings: 1,
          date: selectedDate,
        },
      });
      resetState();
      sheetRef.current?.dismiss();
    };

    const handleRemoveMeal = () => {
      if (!mealPlanRecipeToEdit || mode !== 'edit') return;
      removeRecipeFromMealPlan({
        mealPlanRecipeId: mealPlanRecipeToEdit.id,
      });
      resetState();
      sheetRef.current?.dismiss();
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
      <View>
        <BottomSheet
          ref={sheetRef}
          onStartClose={() => {
            KeyboardController.dismiss();
          }}
        >
          {currentView === 'search' ? (
            <RecipeSearch
              sheetRef={sheetRef}
              canGoBack={canGoBack}
              onItemSelect={recipe => {
                if (mode === 'add') {
                  // Immediately add recipe when in add mode
                  if (selectedDate && mealTag) {
                    addRecipeToMealPlan({
                      mealPlanId: props.mealPlanId,
                      recipeId: recipe.id,
                      mealTag,
                      date: selectedDate,
                    });
                    resetState();
                    sheetRef.current?.dismiss();
                  }
                } else {
                  // For edit mode, show the recipe view
                  setSelectedRecipe(recipe);
                  setCurrentView('recipe');
                  setCanGoBack(true);
                }
              }}
              onBack={() => {
                setCurrentView('recipe');
              }}
            />
          ) : (
            <View>
              <View className="gap-2">
                {recipeToDisplay && (
                  <View className="w-full flex-row items-center justify-between gap-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl font-semibold text-foreground">
                        {recipeToDisplay?.name}
                      </Text>
                    </View>
                    <MealSheetRecipeDropdown
                      recipeId={recipeToDisplay.id}
                      recipeName={recipeToDisplay.name}
                      onRemove={handleRemoveMeal}
                      onViewRecipe={() => {
                        router.push(navigation.goToRecipe(recipeToDisplay.id));
                        sheetRef.current?.dismiss();
                        calendarSheetRef.current?.dismiss();
                      }}
                      onChangeRecipe={() => {
                        setCurrentView('search');
                      }}
                    />
                  </View>
                )}

                <View className="gap-4">
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() =>
                        calendarSheetRef.current?.present({
                          selectedDate: selectedDate
                            ? startOfDay(parseISO(selectedDate + 'T00:00:00'))
                            : undefined,
                          validStartDate: startOfDay(parseISO(props.startDate)),
                          validEndDate: startOfDay(parseISO(props.endDate)),
                        })
                      }
                    >
                      <Pill
                        hasValue={!!selectedDate}
                        icon={<Icon as={CalendarIcon} size={16} />}
                      >
                        <Text className="text-left">
                          {selectedDate
                            ? startOfDay(
                                parseISO(selectedDate + 'T00:00:00')
                              ).toLocaleDateString()
                            : 'Select Date'}
                        </Text>
                      </Pill>
                    </Pressable>
                    <MealTimeSelector
                      onSelect={setMealTag}
                      mealTime={mealTag}
                    />
                  </View>
                  <Button onPress={handleSubmit}>
                    <Text>{mode === 'add' ? 'Add Meal' : 'Update Meal'}</Text>
                  </Button>
                </View>
              </View>
            </View>
          )}
        </BottomSheet>

        <CalendarSheet
          ref={calendarSheetRef}
          headerTitle="Select Date"
          onClose={() => {
            setCurrentView('recipe');
          }}
          onChange={date => {
            setSelectedDate(format(date, 'yyyy-MM-dd'));
            setCurrentView('recipe');
          }}
        />
      </View>
    );
  }
);
