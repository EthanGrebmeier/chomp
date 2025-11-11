import { Tabs } from 'expo-router';
import {
  CalendarIcon,
  CookingPotIcon,
  NotebookTabsIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { KeyboardToolbar } from 'react-native-keyboard-controller';

import { Icon } from '../../components/ui/icon';
import { useActiveMealPlan } from '../../features/meal-planner/hooks';
import { useRecipes } from '../../features/recipes/hooks';
import { ACCENT_COLORS, THEME } from '../../lib/theme';

export default function Layout() {
  const colorscheme = useColorScheme();
  useActiveMealPlan();
  useRecipes();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor:
              colorscheme.colorScheme === 'dark'
                ? THEME.dark.background
                : THEME.light.background,
            borderTopColor:
              colorscheme.colorScheme === 'dark'
                ? THEME.dark.border
                : THEME.light.border,
            shadowOffset: {
              width: 0,
              height: -10,
            },
            shadowOpacity: 0.1,
            shadowRadius: 10.41,
            elevation: 1,
          },
          tabBarActiveTintColor: ACCENT_COLORS.orange.foreground,
          tabBarInactiveTintColor:
            colorscheme.colorScheme === 'dark'
              ? THEME.dark.mutedForeground
              : THEME.light.mutedForeground,
          tabBarLabelStyle: {
            fontWeight: 'bold',
            fontSize: 12,
          },
        }}
      >
        <Tabs.Screen
          name="list"
          options={{
            title: 'Grocery List',
            tabBarIcon: ({ color }) => (
              <Icon as={NotebookTabsIcon} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="plans"
          options={{
            title: 'Meal Plan',
            tabBarIcon: ({ color }) => (
              <Icon as={CalendarIcon} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: 'Recipes',
            tabBarIcon: ({ color }) => (
              <Icon as={CookingPotIcon} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      <KeyboardToolbar />
    </>
  );
}
