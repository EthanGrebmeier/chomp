import { Tabs } from 'expo-router';
import {
  CalendarIcon,
  CookingPotIcon,
  NotebookTabsIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { Icon } from '../../components/ui/icon';
import { THEME } from '../../lib/theme';

export default function Layout() {
  const colorscheme = useColorScheme();

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
          },
          tabBarActiveTintColor:
            colorscheme.colorScheme === 'dark'
              ? THEME.dark.primary
              : THEME.light.primary,
          tabBarInactiveTintColor:
            colorscheme.colorScheme === 'dark'
              ? THEME.dark.mutedForeground
              : THEME.light.mutedForeground,
        }}
      >
        <Tabs.Screen
          name="lists"
          options={{
            title: 'Lists',
            tabBarIcon: ({ color }) => (
              <Icon as={NotebookTabsIcon} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="plans"
          options={{
            title: 'Meal Plans',
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
