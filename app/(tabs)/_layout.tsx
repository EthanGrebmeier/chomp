import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

import { useActiveMealPlan } from '../../features/meal-planner/hooks';
import { useRecipes } from '../../features/recipes/hooks';

export default function Layout() {
  const { isSignedIn } = useAuth();
  
  useActiveMealPlan();
  useRecipes();

  // If the user is not signed in, redirect to sign-in page
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in-email" />;
  }

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
