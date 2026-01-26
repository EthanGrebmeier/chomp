import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ShoppingCartIcon, UsersIcon } from 'lucide-react-native';
import { useMemo, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { useGroceryLists } from '../../grocery-lists/instant/useGroceryLists';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { useAddMealsToGroceryList, useUserMealPlanData } from '../hooks';

export const ListSelectorSheet = () => {
  const sheetRef = useRef<TrueSheet>(null);
  const { data: lists } = useGroceryLists();
  const { recipes, items } = useUserMealPlanData();
  const { mutate: addMealsToGroceryList, isPending: isAddingToList } =
    useAddMealsToGroceryList();

  const unaddedCount = useMemo(() => {
    const unaddedRecipes = recipes.filter(r => !r.addedToList).length;
    const unaddedItems = items.filter(i => !i.addedToList).length;
    return unaddedRecipes + unaddedItems;
  }, [recipes, items]);

  const handleAddToList = (listId: string) => {
    addMealsToGroceryList(
      { listId },
      {
        onSuccess: result => {
          const totalAdded = result.addedRecipes + result.addedItems;
          if (totalAdded === 0) {
            toast.info('No new meals to add - all meals already added to list');
          } else {
            toast.success(
              `Added ${totalAdded} item${totalAdded > 1 ? 's' : ''} to list`
            );
          }
          sheetRef.current?.dismiss();
        },
        onError: () => {
          toast.error('Failed to add meals to list');
        },
      }
    );
  };

  return (
    <>
      <BottomSheet
        name="add-meals-to-list-sheet"
        ref={sheetRef}
        detents={['auto']}
      >
        <BottomSheet.Header
          className="px-4"
          title="Add Meal Plan Items to List"
        />
        <ScrollView className="max-h-80 px-4 pb-4">
          {lists?.grocery_lists.map(list => {
            const isShared = (list.shares?.length ?? 0) > 1;
            return (
              <Pressable
                key={list.id}
                onPress={() => handleAddToList(list.id)}
                disabled={isAddingToList}
                className={cn(
                  'mb-2 rounded-xl px-4 py-3',
                  isAddingToList ? 'bg-muted/50' : 'bg-muted active:bg-muted/80'
                )}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg">{list.name}</Text>
                  {isShared && (
                    <Icon
                      as={UsersIcon}
                      size={16}
                      className="text-muted-foreground"
                    />
                  )}
                </View>
                <Text className="text-sm text-muted-foreground">
                  {list.grocery_items?.filter(i => !i.isDeleted && !i.isChecked)
                    .length || 0}{' '}
                  items
                </Text>
              </Pressable>
            );
          })}
          {(!lists?.grocery_lists || lists.grocery_lists.length === 0) && (
            <Text className="text-center text-muted-foreground">
              No lists available
            </Text>
          )}
        </ScrollView>
      </BottomSheet>
      {unaddedCount > 0 && (
        <Button
          size="iconLg"
          variant="secondary"
          className="absolute left-6 z-10"
          style={{ bottom: NATIVE_TABS_OFFSET }}
          onPress={() => sheetRef.current?.present()}
          disabled={isAddingToList}
        >
          <Icon
            as={ShoppingCartIcon}
            size={20}
            strokeWidth={3}
            className="text-secondary-foreground"
          />
          {unaddedCount > 0 && (
            <View className="absolute -right-3 -top-3 ml-1 rounded-full bg-primary px-2 ">
              <Text className="text-base font-semibold text-primary-foreground">
                {unaddedCount}
              </Text>
            </View>
          )}
        </Button>
      )}
    </>
  );
};

ListSelectorSheet.displayName = 'ListSelectorSheet';
