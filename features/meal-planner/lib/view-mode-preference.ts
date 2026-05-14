import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealPlannerViewMode = 'calendar' | 'list';

export const DEFAULT_MEAL_PLANNER_VIEW_MODE: MealPlannerViewMode = 'calendar';

export const getMealPlannerViewModePreferenceKey = (userId?: string) =>
  `meal-planner:view-mode:${userId ?? 'anonymous'}`;

export const getStoredMealPlannerViewMode = async (
  userId?: string
): Promise<MealPlannerViewMode | null> => {
  const storedMode = await AsyncStorage.getItem(
    getMealPlannerViewModePreferenceKey(userId)
  );
  return storedMode === 'calendar' || storedMode === 'list' ? storedMode : null;
};
