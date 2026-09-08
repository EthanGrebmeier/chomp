import { Stack } from 'expo-router';

import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
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

  return (
    <>
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
    </>
  );
}
