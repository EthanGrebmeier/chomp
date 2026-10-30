import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCategoryOptions } from '@/features/categories/use-category-options';
import { useGroceryListItems } from '@/features/grocery-list/instant/useGroceryListItems';
import type { ShoppingSession } from '@/features/grocery-list/shopping/destinations';
import { ShoppingScreen } from '@/features/grocery-list/shopping/shopping-screen';
import { useShoppingSession } from '@/features/grocery-list/shopping/use-shopping-session';
import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { useQuantityList } from '@/features/quantity/app/session';
import { db } from '@/lib/instant';
import { buildListUrl } from '@/lib/navigation';
import { useStartupScreenReady } from '@/lib/startup-screen-ready';

const PICKER: ShoppingSession = { screen: 'picker' };

export default function ShoppingRoute() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();
  const { user } = db.useAuth();
  const shopping = useShoppingSession(user?.id, listId);
  const navigation = useNavigation();
  const { setSession } = shopping;

  // A committed back gesture, Android back, and Exit all end the session.
  // Merely backgrounding the app or covering this route keeps it resumable.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        setSession(null);
      }),
    [navigation, setSession]
  );

  const exit = () => {
    if (router.canGoBack()) router.back();
    else router.replace(buildListUrl({ listId }));
  };

  return (
    <View className="pt-safe flex-1 bg-background">
      {listId && shopping.ready ? (
        <ShoppingRouteContent
          key={listId}
          listId={listId}
          initialSession={shopping.session ?? PICKER}
          persistSession={setSession}
          onExit={exit}
        />
      ) : (
        <ShoppingPlaceholder listId={listId} onExit={exit} />
      )}
    </View>
  );
}

function ShoppingRouteContent({
  listId,
  initialSession,
  persistSession,
  onExit,
}: {
  listId: string;
  initialSession: ShoppingSession;
  persistSession: (session: ShoppingSession | null) => void;
  onExit: () => void;
}) {
  // Retain the displayed destination through the native pop animation even
  // after beforeRemove clears the persisted session.
  const [session, setSession] = useState(initialSession);
  const { items, isLoading, error } = useGroceryListItems(listId);
  const {
    data: lists,
    isLoading: listsLoading,
    error: listsError,
  } = useGroceryLists();
  const categories = useCategoryOptions();
  const quantity = useQuantityList(listId);
  const [contentRendered, setContentRendered] = useState(false);
  const handleContentReady = useCallback(() => setContentRendered(true), []);
  const loadError = error ?? listsError ?? categories.error;
  const dataReady =
    !loadError &&
    !isLoading &&
    !listsLoading &&
    !categories.isLoading &&
    quantity.canEdit;
  useStartupScreenReady(
    Boolean(loadError) || (dataReady && contentRendered),
    'shopping'
  );
  const listName = lists?.grocery_lists.find(list => list.id === listId)?.name;

  return (
    <View className="flex-1">
      {loadError ? (
        <Text accessibilityRole="alert" className="px-4 py-2 text-destructive">
          Could not load shopping items. Check your connection.
        </Text>
      ) : null}
      <ShoppingScreen
        onReady={handleContentReady}
        listId={listId}
        listName={listName}
        items={items}
        isLoading={isLoading}
        session={session}
        onExit={onExit}
        onSessionChange={next => {
          setSession(next);
          persistSession(next);
        }}
      />
    </View>
  );
}

function ShoppingPlaceholder({
  listId,
  onExit,
}: {
  listId?: string;
  onExit: () => void;
}) {
  useStartupScreenReady(!listId, 'shopping');
  return (
    <View className="flex-1 px-4">
      <Button variant="ghost" className="min-h-11 self-start" onPress={onExit}>
        <Text>Exit shopping</Text>
      </Button>
      <Text className="mt-8 text-center text-muted-foreground">
        {listId
          ? 'Loading shopping…'
          : 'Choose a grocery list to start shopping.'}
      </Text>
    </View>
  );
}
