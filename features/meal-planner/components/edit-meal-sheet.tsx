import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { format, parseISO, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { CalendarIcon } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../../../components/bottom-sheet';
import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { Text } from '../../../components/ui/text';
import { navigation } from '../../../lib/navigation';
import { Recipe, RecipeWithIngredients } from '../../recipes/types';
import { useRemoveRecipeFromMealPlan } from '../hooks/useRemoveRecipeFromMealPlan';
import { useUpdateMealPlanRecipe } from '../hooks/useUpdateMealPlanRecipe';
import { MealPlanRecipe } from '../types';

import { MealSheetRecipeDropdown } from './meal-sheet-recipe-dropdown';
import { MealTimeSheet } from './meal-time-sheet';

type EditMealSheetProps = {};

export type EditMealSheetRef = {
  open: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipe;
    recipe: Recipe;
  }) => void;
};

export const EditMealSheet = forwardRef<EditMealSheetRef, EditMealSheetProps>(
  (props, ref) => {
    const [currentView, setCurrentView] = useState<'recipe' | 'search'>(
      'recipe'
    );
    const [mealTag, setMealTag] = useState<string | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(
      undefined
    );
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [mealPlanRecipeToEdit, setMealPlanRecipeToEdit] =
      useState<MealPlanRecipe | null>(null);

    const sheetRef = useRef<TrueSheet>(null);
    const calendarSheetRef = useRef<CalendarSheetRef>(null);
    const { mutate: updateMealPlanRecipe } = useUpdateMealPlanRecipe();
    const { mutate: removeRecipeFromMealPlan } = useRemoveRecipeFromMealPlan();

    useImperativeHandle(ref, () => ({
      open: ({
        mealPlanRecipe,
        recipe,
      }: {
        mealPlanRecipe: MealPlanRecipe;
        recipe: Recipe;
      }) => {
        setSelectedDate(mealPlanRecipe.date);
        setSelectedRecipe(recipe);
        setMealPlanRecipeToEdit(mealPlanRecipe);
        setMealTag(mealPlanRecipe.mealTag ?? undefined);
        setCurrentView('recipe');
        sheetRef.current?.present();
      },
    }));

    const resetState = () => {
      setSelectedRecipe(null);
      setSelectedDate(undefined);
      setCurrentView('recipe');
      setMealTag(undefined);
      setMealPlanRecipeToEdit(null);
    };

    const handleUpdateMealPlanRecipe = () => {
      if (!selectedRecipe || !mealPlanRecipeToEdit) return;

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
      if (!mealPlanRecipeToEdit) return;

      removeRecipeFromMealPlan({
        mealPlanRecipeId: mealPlanRecipeToEdit.id,
      });

      resetState();
      sheetRef.current?.dismiss();
    };

    const handleRecipeChange = (recipe: RecipeWithIngredients) => {
      setSelectedRecipe(recipe);
      setCurrentView('recipe');
    };

    return (
      <BottomSheet
        name="edit-meal-sheet"
        ref={sheetRef}
        onStartClose={() => {
          KeyboardController.dismiss();
        }}
      >
        <BottomSheet.SheetView>
          <CalendarSheet
            name="edit-meal-calendar-sheet"
            ref={calendarSheetRef}
            headerTitle="Select Date"
            selectedDate={
              selectedDate
                ? startOfDay(parseISO(selectedDate + 'T00:00:00'))
                : undefined
            }
            onClose={() => {
              setCurrentView('recipe');
            }}
            onChange={date => {
              setSelectedDate(format(date, 'yyyy-MM-dd'));
              setCurrentView('recipe');
            }}
          />
          {currentView === 'search' ? (
            <View className="gap-2">
              <BackButton onPress={() => setCurrentView('recipe')} />
              <RecipeSelector
                onSelectRecipe={handleRecipeChange}
                onDismiss={() => sheetRef.current?.dismiss()}
              />
            </View>
          ) : (
            <View>
              <View className="gap-2">
                {selectedRecipe && (
                  <View className="w-full flex-row items-center justify-between gap-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl font-semibold text-foreground">
                        {selectedRecipe.name}
                      </Text>
                    </View>
                    <MealSheetRecipeDropdown
                      recipeId={selectedRecipe.id}
                      recipeName={selectedRecipe.name}
                      onRemove={handleRemoveMeal}
                      onViewRecipe={() => {
                        router.push(navigation.goToRecipe(selectedRecipe.id));
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
                      onPress={() => calendarSheetRef.current?.present()}
                    >
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
                  <Button onPress={handleUpdateMealPlanRecipe}>
                    <Text>Update Meal</Text>
                  </Button>
                </View>
              </View>
            </View>
          )}
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

EditMealSheet.displayName = 'EditMealSheet';
