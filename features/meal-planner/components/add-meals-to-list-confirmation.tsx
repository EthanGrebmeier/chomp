import { format } from 'date-fns';
import { router } from 'expo-router';
import { PencilIcon } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, SectionList, View } from 'react-native';
import { toast } from 'sonner-native';

import { formatQuantityUnit } from '@/components/item-sheet/unit-utils';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { navigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import { RecipeCardContent } from '../../recipes/components/recipe-card';
import { useAddMealsToGroceryList } from '../hooks/useAddMealPlanToGroceryList';
import { useUserMealPlanData } from '../hooks/useUserMealPlanData';
import {
  MealPlanItemWithStore,
  MealPlanRecipeWithRecipe,
  MealTag,
} from '../types';
import { getAddMealsToListSelection } from '../utils/add-meals-to-list-selection';

import { EditMealSheet, EditMealSheetRef } from './edit-meal-sheet';

const mealTimeOrder: MealTag[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'None',
];

const formatMealPlanDate = (dateString: string): string => {
  try {
    const [datePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    return format(new Date(year, month - 1, day), 'EEE, MMM d');
  } catch {
    return '';
  }
};

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

type DaySection = {
  date: string;
  title: string;
  data: UnaddedEntry[];
};

type MealPlanRowProps = {
  name: string;
  mealTag?: string;
  quantity?: string;
  isSelected: boolean;
  onToggle: () => void;
};

function MealPlanRow({
  name,
  mealTag,
  quantity,
  isSelected,
  onToggle,
}: MealPlanRowProps) {
  const subtitle = mealTag && mealTag !== 'None' ? mealTag : undefined;

  return (
    <View className="py-2">
      <HapticPressable
        onPress={onToggle}
        hapticType="selection"
        className="flex-row items-center gap-3"
      >
        <Checkbox checked={isSelected} onPress={onToggle} className="mr-1" />
        <View className="flex-1">
          <Text
            className={cn(
              'overflow-ellipsis text-xl font-medium',
              isSelected ? 'text-foreground' : 'text-muted-foreground'
            )}
            numberOfLines={2}
          >
            {name}
            {quantity ? (
              <Text
                className={cn(
                  'text-base font-normal text-muted-foreground',
                  !isSelected && 'text-muted-foreground/80'
                )}
              >
                {'  '}
                {quantity}
              </Text>
            ) : null}
          </Text>
          {subtitle ? (
            <Text
              className={cn(
                'text-sm text-muted-foreground',
                !isSelected && 'text-muted-foreground/80'
              )}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </HapticPressable>
    </View>
  );
}

type MealPlanRecipeRowProps = {
  name: string;
  ingredientCount: number;
  mealTag?: string;
  trailing?: string;
  isSelected: boolean;
  onToggle: () => void;
  onReview: () => void;
};

function MealPlanRecipeRow({
  name,
  ingredientCount,
  mealTag,
  trailing,
  isSelected,
  onToggle,
  onReview,
}: MealPlanRecipeRowProps) {
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });
  const subtitle =
    mealTag && mealTag !== 'None'
      ? `${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'} · ${mealTag}`
      : `${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}`;

  return (
    <View className="py-2">
      <View className="flex-row items-center gap-2">
        <HapticPressable
          onPress={onToggle}
          hapticType="selection"
          className="flex-1 flex-row items-center gap-3"
        >
          <Checkbox checked={isSelected} onPress={onToggle} className="mr-1" />
          <View className="flex-1 flex-row items-center gap-2">
            <RecipeCardContent
              name={name}
              ingredientCount={ingredientCount}
              subtitle={subtitle}
              className="flex-1"
              titleClassName={
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              }
              subtitleClassName={
                !isSelected ? 'text-muted-foreground/80' : undefined
              }
            />
            {trailing ? (
              <Text variant="itemMeta" style={compactTextStyle}>
                {trailing}
              </Text>
            ) : null}
          </View>
        </HapticPressable>
        <Button variant="ghost" size="sm" onPress={onReview}>
          <Icon
            as={PencilIcon}
            size={16}
            strokeWidth={3}
            className="text-muted-foreground"
          />
        </Button>
      </View>
    </View>
  );
}

type AddMealsToListConfirmationProps = {
  listId: string;
};

export function AddMealsToListConfirmation({
  listId,
}: AddMealsToListConfirmationProps) {
  const editMealSheet = useRef<EditMealSheetRef>(null);
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(new Set());
  const { recipes, items, isLoading } = useUserMealPlanData(listId);
  const { mutate: addMealsToGroceryList, isPending } =
    useAddMealsToGroceryList();

  const { sections, recipeIds, itemIds, unaddedCount, summary } =
    useMemo(() => {
      const unaddedRecipes = recipes.filter(recipe => !recipe.addedToList);
      const unaddedItems = items.filter(item => !item.addedToList);
      const entries: UnaddedEntry[] = [
        ...unaddedRecipes.map(
          (recipe): UnaddedRecipe => ({
            kind: 'recipe',
            id: recipe.id,
            date: recipe.date,
            mealTag: recipe.mealTag,
            recipe,
          })
        ),
        ...unaddedItems.map(
          (item): UnaddedItem => ({
            kind: 'item',
            id: item.id,
            date: item.date,
            mealTag: item.mealTag,
            item,
          })
        ),
      ];
      const mealTagIndex = (tag?: string) => {
        const index = mealTimeOrder.indexOf((tag ?? 'None') as MealTag);
        return index === -1 ? mealTimeOrder.length : index;
      };

      entries.sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        return (
          dateComparison || mealTagIndex(a.mealTag) - mealTagIndex(b.mealTag)
        );
      });

      const sectionsByDate = new Map<string, DaySection>();
      for (const entry of entries) {
        const section = sectionsByDate.get(entry.date);
        if (section) {
          section.data.push(entry);
        } else {
          sectionsByDate.set(entry.date, {
            date: entry.date,
            title: formatMealPlanDate(entry.date),
            data: [entry],
          });
        }
      }

      const summaryParts: string[] = [];
      if (unaddedRecipes.length > 0) {
        summaryParts.push(
          `${unaddedRecipes.length} recipe${unaddedRecipes.length === 1 ? '' : 's'}`
        );
      }
      if (unaddedItems.length > 0) {
        summaryParts.push(
          `${unaddedItems.length} item${unaddedItems.length === 1 ? '' : 's'}`
        );
      }

      return {
        sections: [...sectionsByDate.values()],
        recipeIds: new Set(unaddedRecipes.map(recipe => recipe.id)),
        itemIds: new Set(unaddedItems.map(item => item.id)),
        unaddedCount: entries.length,
        summary:
          summaryParts.length > 0
            ? `${summaryParts.join(' and ')} ready to add`
            : 'Add meals to your meal plan to see them here.',
      };
    }, [items, recipes]);

  const toggleItem = (id: string) => {
    setDeselectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddToList = () => {
    if (isPending || unaddedCount === 0) return;

    const {
      selectedRecipeIds,
      skippedRecipeIds,
      selectedItemIds,
      skippedItemIds,
    } = getAddMealsToListSelection({
      recipeIds,
      itemIds,
      deselectedIds,
    });

    addMealsToGroceryList(
      {
        listId,
        selectedRecipeIds,
        skippedRecipeIds:
          skippedRecipeIds.length > 0 ? skippedRecipeIds : undefined,
        selectedItemIds,
        skippedItemIds: skippedItemIds.length > 0 ? skippedItemIds : undefined,
      },
      {
        onSuccess: result => {
          if (result.addedRecipes + result.addedItems === 0) {
            toast.info('No new meals to add - all meals already added to list');
          }
          router.dismissTo(navigation.goToList(listId));
        },
        onError: () => {
          toast.error('Failed to add meals to list');
        },
      }
    );
  };

  const renderEntry = ({ item }: { item: UnaddedEntry }) => {
    const isSelected = !deselectedIds.has(item.id);

    if (item.kind === 'recipe') {
      const mealPlanRecipe = item.recipe;
      const recipe = mealPlanRecipe.recipe;
      const snapshots = mealPlanRecipe.ingredient_snapshots ?? [];
      const selectedIngredientCount = snapshots.filter(
        snapshot => snapshot.isSelected
      ).length;
      const ingredientCount =
        snapshots.length > 0
          ? selectedIngredientCount
          : (recipe.recipe_ingredients?.length ?? 0);
      const servings = mealPlanRecipe.servings || 1;

      return (
        <MealPlanRecipeRow
          name={recipe.name}
          mealTag={mealPlanRecipe.mealTag}
          ingredientCount={ingredientCount}
          trailing={servings > 1 ? `x${servings}` : undefined}
          isSelected={isSelected}
          onToggle={() => toggleItem(mealPlanRecipe.id)}
          onReview={() =>
            editMealSheet.current?.open({
              mealPlanRecipe,
              recipe,
            })
          }
        />
      );
    }

    return (
      <MealPlanRow
        name={item.item.name}
        mealTag={item.item.mealTag}
        quantity={formatQuantityUnit(item.item.quantity, item.item.unit)}
        isSelected={isSelected}
        onToggle={() => toggleItem(item.item.id)}
      />
    );
  };

  return (
    <View className="flex-1 bg-background pt-6">
      <View className="flex-row items-center gap-2 px-4 pb-3">
        <BackButton />
        <View className="flex-1">
          <Text className="text-2xl font-semibold text-foreground">
            Add to Grocery List
          </Text>
          <Text className="text-sm text-muted-foreground">{summary}</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" />
          <Text className="mt-2 text-sm text-muted-foreground">
            Loading meals…
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderSectionHeader={({ section }) => (
            <View className="bg-background pt-4">
              <Text variant="overline">{section.title}</Text>
            </View>
          )}
          renderItem={renderEntry}
          keyExtractor={item => item.id}
          ListEmptyComponent={<View />}
          contentContainerClassName="px-4 pb-6"
          contentInsetAdjustmentBehavior="automatic"
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View className="pb-safe border-t border-border px-10 pt-4">
        <Button
          onPress={handleAddToList}
          disabled={isPending || unaddedCount === 0}
          className="mb-4"
        >
          <Text>{isPending ? 'Adding...' : 'Add to Grocery List'}</Text>
        </Button>
      </View>

      <EditMealSheet ref={editMealSheet} listId={listId} />
    </View>
  );
}
