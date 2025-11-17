import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

import { useActiveMealPlan } from '../../features/meal-planner/hooks';
import { useRecipes } from '../../features/recipes/hooks';

export default function Layout() {
  useActiveMealPlan();
  useRecipes();

  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf="square.and.pencil" />
          <Label> List </Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="plans">
          <Icon sf="calendar" />
          <Label> Meal Plan </Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="recipes">
          <Icon sf="book.fill" />
          <Label> Recipes </Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
