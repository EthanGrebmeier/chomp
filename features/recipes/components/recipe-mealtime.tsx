import { toast } from 'sonner-native';

import { MealTimeDropdown } from '../../meal-planner/components/meal-time-dropdown';
import { updateRecipe } from '../instant/update-recipe';

type RecipeMealtimeProps = {
  mealTag?: string;
  recipeId: string;
};

export const RecipeMealtime = ({ mealTag, recipeId }: RecipeMealtimeProps) => {
  const onSelect = (mealTime?: string) => {
    void updateRecipe({
      recipeId,
      updates: {
        mealTag: mealTime,
      },
    }).catch(() => toast.error('Could not update meal time'));
  };
  return <MealTimeDropdown mealTime={mealTag} onSelect={onSelect} />;
};

export default RecipeMealtime;
