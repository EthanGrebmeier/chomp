import { Check, ChevronRight, Store } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import AddItemSheet from '@/components/item-sheet/add-item/add-item-sheet';
import EditItemProvider from '@/components/item-sheet/edit-item/edit-item-sheet';
import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { GroceryItemsList } from '../components/grocery-items-list';
import type { GroceryListItemWithRecipe } from '../types';

import {
  findShoppingDestination,
  getShoppingDestinations,
  getShoppingItems,
  type ShoppingSession,
} from './destinations';
import { ShoppingComplete } from './shopping-complete';
import { ShoppingHeader } from './shopping-header';

type Props = {
  listId: string;
  listName?: string;
  items: GroceryListItemWithRecipe[];
  isLoading: boolean;
  session: ShoppingSession;
  onSessionChange: (session: ShoppingSession) => void;
  onExit: () => void;
};

export function ShoppingScreen({
  listId,
  listName,
  items,
  isLoading,
  session,
  onSessionChange,
  onExit,
}: Props) {
  const destinations = getShoppingDestinations(items);
  const representedDestination = findShoppingDestination(
    destinations,
    items,
    session
  );
  // Keep the editor mounted if its last item moves to another store while
  // the native sheet is open. Also retain the destination during hydration.
  const selected =
    representedDestination ??
    (session.screen === 'store'
      ? {
          storeId: session.storeId,
          name:
            session.storeId === null
              ? 'No store'
              : (session.storeName ?? 'Store'),
          remaining: 0,
        }
      : undefined);
  const focusedItems = selected ? getShoppingItems(items, selected) : [];
  const isComplete =
    !isLoading && selected?.remaining === 0 && focusedItems.length > 0;

  return (
    <View className="flex-1 bg-background">
      <ShoppingHeader
        listName={listName}
        selected={selected}
        destinations={destinations}
        total={focusedItems.length}
        isLoading={isLoading}
        onExit={onExit}
        onSelect={destination =>
          onSessionChange({
            screen: 'store',
            storeId: destination.storeId,
            storeName: destination.name,
          })
        }
      />
      {selected ? (
        <>
          {!isLoading && focusedItems.length === 0 ? (
            <View className="mx-4 mb-3 gap-2 rounded-2xl bg-muted p-4">
              <View className="flex-row items-center gap-2">
                <Icon as={Check} size={20} />
                <Text
                  className="font-semibold"
                  accessibilityLiveRegion="polite"
                >
                  No items at this destination
                </Text>
              </View>
              <Button
                variant="outline"
                className="min-h-11"
                onPress={() => onSessionChange({ screen: 'picker' })}
              >
                <Text>Choose another store</Text>
              </Button>
            </View>
          ) : null}
          <EditItemProvider groceryListId={listId}>
            {isComplete ? (
              <ShoppingComplete
                key={`${listId}:${selected.storeId ?? 'no-store'}`}
                items={focusedItems}
                onChooseStore={() => onSessionChange({ screen: 'picker' })}
              />
            ) : focusedItems.length > 0 || isLoading ? (
              <GroceryItemsList
                key={selected.storeId ?? 'no-store'}
                items={focusedItems}
                totalItemCount={focusedItems.length}
                isLoading={isLoading}
                groupBy="category"
                sortBy="name"
                hideOrganizationTags
              />
            ) : (
              <View className="flex-1" />
            )}
          </EditItemProvider>
          <AddItemSheet
            key={selected.storeId ?? 'no-store'}
            groceryListId={listId}
            isTriggerVisible={
              !isLoading &&
              !isComplete &&
              (Boolean(representedDestination) || selected.storeId === null)
            }
            focusedStore={
              selected.storeId === null
                ? null
                : { id: selected.storeId, name: selected.name }
            }
          />
        </>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-12"
          showsVerticalScrollIndicator={false}
        >
          <Text className="mb-4 mt-3 text-2xl font-semibold">
            Choose a store
          </Text>
          {isLoading ? (
            <Text>Loading stores…</Text>
          ) : destinations.length === 0 ? (
            <Text className="text-muted-foreground">
              Add items to your grocery list to start shopping.
            </Text>
          ) : (
            destinations.map(destination => (
              <HapticPressable
                key={destination.storeId ?? 'no-store'}
                accessibilityRole="button"
                accessibilityLabel={`${destination.name}, ${destination.remaining === 0 ? 'complete' : `${destination.remaining} remaining`}`}
                className="min-h-16 flex-row items-center gap-3 border-b border-foreground/10 py-3 active:opacity-60"
                onPress={() =>
                  onSessionChange({
                    screen: 'store',
                    storeId: destination.storeId,
                    storeName: destination.name,
                  })
                }
              >
                <Icon
                  as={destination.remaining === 0 ? Check : Store}
                  size={18}
                  className="text-muted-foreground"
                />
                <Text className="min-w-0 flex-1 text-lg font-medium">
                  {destination.name}
                </Text>
                <Text className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {destination.remaining === 0
                    ? 'Done'
                    : `${destination.remaining} left`}
                </Text>
                <Icon
                  as={ChevronRight}
                  size={14}
                  className="text-muted-foreground"
                />
              </HapticPressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
