import { MealTimeSheet } from '../../meal-planner/components/meal-time-sheet';
import { updateRecipe } from '../instant/update-recipe';

type RecipeMealtimeProps = {
  mealTag?: string;
  recipeId: string;
};

export const RecipeMealtime = ({ mealTag, recipeId }: RecipeMealtimeProps) => {
  const onSelect = (mealTime?: string) => {
    updateRecipe({
      recipeId,
      updates: {
        mealTag: mealTime,
      },
    });
  };
  return (
    <MealTimeSheet mealTime={mealTag} onSelect={onSelect} canGoBack={false} />
  );
};

export default RecipeMealtime;
