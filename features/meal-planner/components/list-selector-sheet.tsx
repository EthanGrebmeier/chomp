import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { CheckIcon, ShoppingCartIcon, UsersIcon } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { navigation } from '../../../lib/navigation';
import { cn } from '../../../lib/utils';
import { useGroceryLists } from '../../grocery-lists/instant/useGroceryLists';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { useAddMealsToGroceryList, useUserMealPlanData } from '../hooks';

type Step = 'review' | 'select-list';

const formatMealPlanDate = (dateStr: string): string => {
  try {
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return format(parsedDate, 'EEE, MMM d');
  } catch {
    return '';
  }
};

type MealPlanRowProps = {
  name: string;
  date: string;
  mealTag?: string;
  detail?: string;
  trailing?: string;
  isSelected: boolean;
  onToggle: () => void;
};

const MealPlanRow = ({
  name,
  date,
  mealTag,
  detail,
  trailing,
  isSelected,
  onToggle,
}: MealPlanRowProps) => {
  const dateLabel = formatMealPlanDate(date);

  const metaParts: string[] = [];
  if (dateLabel) metaParts.push(dateLabel);
  if (mealTag && mealTag !== 'None') metaParts.push(mealTag);
  if (detail) metaParts.push(detail);

  return (
    <HapticPressable
      onPress={onToggle}
      hapticType="selection"
      className={cn(
        'mb-2 flex-row items-center gap-3 rounded-xl px-4 py-3',
        isSelected ? 'bg-muted' : 'bg-muted/50'
      )}
    >
      <View
        className={cn(
          'size-6 items-center justify-center rounded-full',
          isSelected ? 'bg-primary' : 'border-2 border-muted-foreground/40'
        )}
      >
        {isSelected && (
          <Icon
            strokeWidth={3}
            as={CheckIcon}
            size={14}
            className="text-primary-foreground"
          />
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className={cn(
              'flex-1 text-lg font-semibold',
              isSelected ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {name}
          </Text>
          {trailing && (
            <Text className="ml-2 text-sm text-muted-foreground">
              {trailing}
            </Text>
          )}
        </View>
        {metaParts.length > 0 && (
          <Text className="text-sm text-muted-foreground">
            {metaParts.join(' · ')}
          </Text>
        )}
      </View>
    </HapticPressable>
  );
};

export const ListSelectorSheet = () => {
  const sheetRef = useRef<TrueSheet>(null);
  const [step, setStep] = useState<Step>('review');
  // Track deselected IDs instead of selected — everything is selected by default
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(new Set());
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

  const isSelected = useCallback(
    (id: string) => !deselectedIds.has(id),
    [deselectedIds]
  );

  const resetSelection = useCallback(() => {
    setDeselectedIds(new Set());
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setDeselectedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleAddToList = (listId: string) => {
    const selectedRecipeIds = unaddedRecipes
      .filter(r => isSelected(r.id))
      .map(r => r.id);
    const skippedRecipeIds = unaddedRecipes
      .filter(r => !isSelected(r.id))
      .map(r => r.id);
    const selectedItemIds = unaddedItems
      .filter(i => isSelected(i.id))
      .map(i => i.id);
    const skippedItemIds = unaddedItems
      .filter(i => !isSelected(i.id))
      .map(i => i.id);

    addMealsToGroceryList(
      {
        listId,
        selectedRecipeIds:
          selectedRecipeIds.length > 0 ? selectedRecipeIds : undefined,
        skippedRecipeIds:
          skippedRecipeIds.length > 0 ? skippedRecipeIds : undefined,
        selectedItemIds:
          selectedItemIds.length > 0 ? selectedItemIds : undefined,
        skippedItemIds:
          skippedItemIds.length > 0 ? skippedItemIds : undefined,
      },
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
        onOpen={resetSelection}
        onStartClose={() => {
          setStep('review');
          resetSelection();
        }}
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
                const ingredientCount =
                  recipe.recipe_ingredients?.length ?? 0;
                const servings = mealPlanRecipe.servings || 1;
                return (
                  <MealPlanRow
                    key={mealPlanRecipe.id}
                    name={recipe.name}
                    date={mealPlanRecipe.date}
                    mealTag={mealPlanRecipe.mealTag}
                    detail={`${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}`}
                    trailing={servings > 1 ? `x${servings}` : undefined}
                    isSelected={isSelected(mealPlanRecipe.id)}
                    onToggle={() => toggleItem(mealPlanRecipe.id)}
                  />
                );
              })}
              {unaddedItems.map(item => (
                <MealPlanRow
                  key={item.id}
                  name={item.name}
                  date={item.date}
                  mealTag={item.mealTag}
                  trailing={formatQuantityUnit(item.quantity, item.unit)}
                  isSelected={isSelected(item.id)}
                  onToggle={() => toggleItem(item.id)}
                />
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
