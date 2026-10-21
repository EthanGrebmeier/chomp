import { MealTimeDropdown } from '../../meal-planner/components/meal-time-dropdown';
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
  return <MealTimeDropdown mealTime={mealTag} onSelect={onSelect} />;
};

export default RecipeMealtime;
