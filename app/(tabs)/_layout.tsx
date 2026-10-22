import { Stack } from 'expo-router';

import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { RecipesSettingsBarHost } from '@/features/shared/components/recipes-settings-bar';
import { useTheme } from '@/hooks/use-theme';
import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

export const unstable_settings = {
  initialRouteName: 'grocery-lists',
};

const AuthenticatedQueryPreloader = () => {
  // Preload the essential grocery-list query for instant availability. Auth-based
  // redirects are handled centrally by `InstantAuthHandler` so protected
  // routes outside of `(tabs)` (e.g. sheets) are covered by the same rule.
  useGroceryLists();

  return null;
};

export default function Layout() {
  const { hasAppAccess } = useInstantAuthState();
  const theme = useTheme();

  // The recipes/settings bar is hosted here (not at the root) so it belongs to
  // the signed-in screens: auth routes and root-level sheets/cards cover it
  // naturally instead of it floating above them during transitions.
  return (
    <RecipesSettingsBarHost>
      {hasAppAccess ? <AuthenticatedQueryPreloader /> : null}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="grocery-lists"
          options={{
            presentation: 'card',
            animation: 'slide_from_left',
            contentStyle: {
              height: '100%',
              backgroundColor: theme.background,
            },
          }}
        />
        <Stack.Screen name="index" />
      </Stack>
    </RecipesSettingsBarHost>
  );
}
