import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS } from 'react-native';

import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { useTheme } from '@/hooks/use-theme';
import { InstantAuthHandler } from '@/lib/instant/use-clerk-auth';

import { useRecipes } from '../../features/recipes/hooks';

export default function Layout() {
  // Preload all essential queries for instant availability
  useRecipes();
  useGroceryLists();

  const theme = useTheme();
  return (
    <>
      <InstantAuthHandler />
      <NativeTabs
        tintColor={DynamicColorIOS({
          dark: theme.primary,
          light: theme.primary,
        })}
      >
        <NativeTabs.Trigger name="index">
          {/* @ts-ignore This is a real symbol  */}
          <Icon sf={{ default: 'receipt', selected: 'receipt.fill' }} />
          <Label> List </Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="plans">
          {/* @ts-ignore This is a real symbol  */}
          <Icon sf={{ default: 'calendar', selected: 'calendar.fill' }} />
          <Label> Meal Plan </Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="recipes">
          <Icon sf={{ default: 'book', selected: 'book.fill' }} />
          <Label> Recipes </Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
          <Label> Settings </Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
