import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../../../components/bottom-sheet';
import { RecipeSearch } from '../../recipes/components/recipe-search';
import { useAddRecipeToMealPlan } from '../hooks/useAddRecipeToMealPlan';
import { MealTag } from '../types';

type AddMealSheetProps = {
  mealPlanId: string;
};

export type AddMealSheetRef = {
  open: ({ date, mealTime }: { date: string; mealTime: MealTag }) => void;
};

export const AddMealSheet = forwardRef<AddMealSheetRef, AddMealSheetProps>(
  (props, ref) => {
    const [mealTag, setMealTag] = useState<MealTag | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(
      undefined
    );

    const sheetRef = useRef<TrueSheet>(null);
    const { mutate: addRecipeToMealPlan } = useAddRecipeToMealPlan();

    useImperativeHandle(ref, () => ({
      open: ({ date, mealTime }: { date: string; mealTime: MealTag }) => {
        setSelectedDate(date);
        setMealTag(mealTime);
        sheetRef.current?.present();
      },
    }));

    const resetState = () => {
      setSelectedDate(undefined);
      setMealTag(undefined);
    };

    const handleAddRecipe = (recipeId: string) => {
      if (!selectedDate || !mealTag) return;
      
      addRecipeToMealPlan({
        mealPlanId: props.mealPlanId,
        recipeId,
        mealTag,
        date: selectedDate,
      });
      
      resetState();
      sheetRef.current?.dismiss();
    };

    return (
      <BottomSheet
        ref={sheetRef}
        onStartClose={() => {
          KeyboardController.dismiss();
        }}
      >
        <RecipeSearch
          sheetRef={sheetRef}
          canGoBack={false}
          onItemSelect={recipe => {
            handleAddRecipe(recipe.id);
          }}
          onBack={() => {
            // No-op for add mode
          }}
        />
      </BottomSheet>
    );
  }
);

AddMealSheet.displayName = 'AddMealSheet';

