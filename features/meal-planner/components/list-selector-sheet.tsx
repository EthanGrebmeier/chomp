import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { ShoppingCartIcon, UsersIcon } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { navigation } from '../../../lib/navigation';
import { cn } from '../../../lib/utils';
import { useGroceryLists } from '../../grocery-lists/instant/useGroceryLists';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { useAddMealsToGroceryList, useUserMealPlanData } from '../hooks';

type Step = 'review' | 'select-list';

export const ListSelectorSheet = () => {
  const sheetRef = useRef<TrueSheet>(null);
  const [step, setStep] = useState<Step>('review');
  const { data: lists } = useGroceryLists();
  const { recipes, items } = useUserMealPlanData();
  const { mutate: addMealsToGroceryList, isPending: isAddingToList } =
    useAddMealsToGroceryList();

  const { unaddedRecipes, unaddedItems, unaddedCount, subtext } =
    useMemo(() => {
      const filteredRecipes = recipes.filter(r => !r.addedToList);
      const filteredItems = items.filter(i => !i.addedToList);
      const parts: string[] = [];

      if (filteredRecipes.length > 0) {
        parts.push(
          `${filteredRecipes.length} recipe${filteredRecipes.length === 1 ? '' : 's'}`
        );
      }

      if (filteredItems.length > 0) {
        parts.push(
          `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'}`
        );
      }

      const summary = parts.length === 0 ? 'no items' : parts.join(' and ');

      return {
        unaddedRecipes: filteredRecipes,
        unaddedItems: filteredItems,
        unaddedCount: filteredRecipes.length + filteredItems.length,
        subtext: `You have ${summary} to add`,
      };
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
          router.push(navigation.goToList(listId));
        },
        onError: () => {
          toast.error('Failed to add meals to list');
        },
      }
    );
  };

  const handleContinue = () => {
    const groceryLists = lists?.grocery_lists ?? [];
    if (groceryLists.length === 1) {
      handleAddToList(groceryLists[0].id);
    } else {
      setStep('select-list');
    }
  };

  return (
    <>
      <BottomSheet
        name="add-meals-to-list-sheet"
        ref={sheetRef}
        detents={['auto']}
        onStartClose={() => setStep('review')}
        viewClassName={cn(step === 'review' ? 'pb-safe' : undefined)}
        footer={
          step === 'review' ? (
            <View className="px-10 pb-4">
              <Button
                onPress={handleContinue}
                disabled={isAddingToList || unaddedCount === 0}
              >
                <Text>
                  {isAddingToList ? 'Adding...' : 'Add to Grocery List'}
                </Text>
              </Button>
            </View>
          ) : undefined
        }
      >
        {step === 'review' ? (
          <Animated.View key="review" entering={FadeIn.duration(150)}>
            <BottomSheet.Header
              className="mb-0 px-4"
              title="Add to Grocery List"
              subsection={<BottomSheet.Subtext>{subtext}</BottomSheet.Subtext>}
            />
            <ScrollView className="max-h-80 px-4 pb-4">
              {unaddedRecipes.map(mealPlanRecipe => {
                const recipe = mealPlanRecipe.recipe;
                const ingredientCount = recipe.recipe_ingredients?.length ?? 0;
                const servings = mealPlanRecipe.servings || 1;
                return (
                  <View
                    key={mealPlanRecipe.id}
                    className="mb-2 rounded-xl bg-muted px-4 py-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 text-lg font-semibold text-foreground">
                        {recipe.name}
                      </Text>
                      {servings > 1 && (
                        <Text className="ml-2 text-sm text-muted-foreground">
                          x{servings}
                        </Text>
                      )}
                    </View>
                    <Text className="text-sm text-muted-foreground">
                      {ingredientCount} ingredient
                      {ingredientCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                );
              })}
              {unaddedItems.map(item => (
                <View
                  key={item.id}
                  className="mb-2 rounded-xl bg-muted px-4 py-3"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-foreground">
                      {item.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {formatQuantityUnit(item.quantity, item.unit)}
                    </Text>
                  </View>
                </View>
              ))}
              {unaddedCount === 0 && (
                <Text className="text-center text-muted-foreground">
                  No items to add
                </Text>
              )}
            </ScrollView>
          </Animated.View>
        ) : (
          <View>
            <BottomSheet.Header
              className="mb-0 px-4"
              title="Choose a List"
              dismissButton={<BackButton onPress={() => setStep('review')} />}
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
                      isAddingToList
                        ? 'bg-muted/50'
                        : 'bg-muted active:bg-muted/80'
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
                      {list.grocery_items?.filter(
                        i => !i.isDeleted && !i.isChecked
                      ).length || 0}{' '}
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
          </View>
        )}
      </BottomSheet>
      <Button
        size="iconLg"
        variant="secondary"
        className="absolute left-6 z-10"
        style={{ bottom: NATIVE_TABS_OFFSET }}
        onPress={() => sheetRef.current?.present()}
        disabled={isAddingToList || unaddedCount === 0}
      >
        <Icon
          as={ShoppingCartIcon}
          size={20}
          strokeWidth={3}
          className="text-secondary-foreground"
        />
      </Button>
    </>
  );
};

ListSelectorSheet.displayName = 'ListSelectorSheet';
