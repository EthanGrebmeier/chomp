import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

import { InstantClerkAuth } from '@/lib/instant/use-clerk-auth';

import { useActiveMealPlan } from '../../features/meal-planner/hooks';
import { useRecipes } from '../../features/recipes/hooks';

export default function Layout() {
  useActiveMealPlan();
  useRecipes();

  return (
    <>
      <InstantClerkAuth />
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
        <NativeTabs.Trigger name="settings">
          <Icon sf="gearshape.fill" />
          <Label> Settings </Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
