import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CheckIcon, ShoppingCartIcon } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
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
import { GroceryListPicker } from '../../grocery-lists/components/grocery-list-picker';
import { useGroceryLists } from '../../grocery-lists/instant/useGroceryLists';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { useAddMealsToGroceryList, useUserMealPlanData } from '../hooks';
import {
  MealPlanItemWithStore,
  MealPlanRecipeWithRecipe,
  MealTag,
} from '../types';

const mealTimeOrder: MealTag[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'None',
];

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
        'mb-2 flex-row items-center gap-3 rounded-xl px-4 py-3 transition-colors',
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
  const isDarkMode = useColorScheme() === 'dark';
  const [step, setStep] = useState<Step>('review');
  // Track deselected IDs instead of selected — everything is selected by default
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(new Set());
  const { data: lists } = useGroceryLists();
  const { recipes, items } = useUserMealPlanData();
  const { mutate: addMealsToGroceryList, isPending: isAddingToList } =
    useAddMealsToGroceryList();

  type UnaddedRecipe = {
    kind: 'recipe';
    id: string;
    date: string;
    mealTag?: string;
    recipe: MealPlanRecipeWithRecipe;
  };

  type UnaddedItem = {
    kind: 'item';
    id: string;
    date: string;
    mealTag?: string;
    item: MealPlanItemWithStore;
  };

  type UnaddedEntry = UnaddedRecipe | UnaddedItem;

  const {
    sortedEntries,
    unaddedRecipeIds,
    unaddedItemIds,
    unaddedCount,
    subtext,
  } = useMemo(() => {
    const mealTagIndex = (tag?: string): number => {
      const idx = mealTimeOrder.indexOf((tag ?? 'None') as MealTag);
      return idx === -1 ? mealTimeOrder.length : idx;
    };

    const filteredRecipes = recipes.filter(r => !r.addedToList);
    const filteredItems = items.filter(i => !i.addedToList);

    const entries: UnaddedEntry[] = [
      ...filteredRecipes.map(
        (r): UnaddedRecipe => ({
          kind: 'recipe',
          id: r.id,
          date: r.date,
          mealTag: r.mealTag,
          recipe: r,
        })
      ),
      ...filteredItems.map(
        (i): UnaddedItem => ({
          kind: 'item',
          id: i.id,
          date: i.date,
          mealTag: i.mealTag,
          item: i,
        })
      ),
    ];

    entries.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return mealTagIndex(a.mealTag) - mealTagIndex(b.mealTag);
    });

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
      sortedEntries: entries,
      unaddedRecipeIds: new Set(filteredRecipes.map(r => r.id)),
      unaddedItemIds: new Set(filteredItems.map(i => i.id)),
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
    const selectedRecipeIds = [...unaddedRecipeIds].filter(id =>
      isSelected(id)
    );
    const skippedRecipeIds = [...unaddedRecipeIds].filter(
      id => !isSelected(id)
    );
    const selectedItemIds = [...unaddedItemIds].filter(id => isSelected(id));
    const skippedItemIds = [...unaddedItemIds].filter(id => !isSelected(id));

    addMealsToGroceryList(
      {
        listId,
        // Always pass arrays so the backend can distinguish "add none" from "add all"
        selectedRecipeIds,
        skippedRecipeIds:
          skippedRecipeIds.length > 0 ? skippedRecipeIds : undefined,
        selectedItemIds,
        skippedItemIds: skippedItemIds.length > 0 ? skippedItemIds : undefined,
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
        detents={['auto', 0.8]}
        scrollable={step === 'review'}
        onOpen={resetSelection}
        onStartClose={() => {
          setStep('review');
          resetSelection();
        }}
        viewClassName="pb-safe"
        footer={
          step === 'review' ? (
            <>
              <View className="z-10 px-10 pb-4">
                <Button
                  onPress={handleContinue}
                  disabled={isAddingToList || unaddedCount === 0}
                >
                  <Text>
                    {isAddingToList ? 'Adding...' : 'Add to Grocery List'}
                  </Text>
                </Button>
              </View>
              <LinearGradient
                colors={
                  isDarkMode
                    ? ['rgba(0,0,0,0.9)', 'rgba(0,0,0,0)']
                    : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']
                }
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                pointerEvents="none"
                style={styles.footerGradient}
              />
            </>
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
            <ScrollView
              className="px-4"
              contentContainerStyle={{ paddingBottom: 80 }}
            >
              {sortedEntries.map(entry => {
                if (entry.kind === 'recipe') {
                  const { recipe: mealPlanRecipe } = entry;
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
                }

                const { item } = entry;
                return (
                  <MealPlanRow
                    key={item.id}
                    name={item.name}
                    date={item.date}
                    mealTag={item.mealTag}
                    trailing={formatQuantityUnit(item.quantity, item.unit)}
                    isSelected={isSelected(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                );
              })}
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
            <GroceryListPicker
              lists={lists?.grocery_lists ?? []}
              onSelectList={handleAddToList}
              disabled={isAddingToList}
            />
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

const styles = StyleSheet.create({
  footerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 0,
  },
});
