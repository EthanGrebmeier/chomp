import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { format } from 'date-fns';
import { PencilIcon } from 'lucide-react-native';
import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Platform, SectionList, View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { formatQuantityUnit } from '@/components/item-sheet/unit-utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
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
  ref?: React.RefObject<AddMealsToListSheetRef | null>;
};

export type AddMealsToListSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export function AddMealsToListConfirmation({
  listId,
  ref,
}: AddMealsToListConfirmationProps) {
  const sheetRef = useRef<TrueSheet>(null);
  const editMealSheet = useRef<EditMealSheetRef>(null);
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(new Set());
  const { recipes, items, isLoading } = useUserMealPlanData(listId);
  const { mutate: addMealsToGroceryList, isPending } =
    useAddMealsToGroceryList();

  const resetSelection = useCallback(() => {
    setDeselectedIds(new Set());
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      present: () => {
        resetSelection();
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [resetSelection]
  );

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
            : 'No meal plan entries are waiting to be added.',
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
          sheetRef.current?.dismiss();
        },
        onError: () => {
          toast.error('Failed to add meals to list');
        },
      }
    );
  };

  const handleReview = (entry: UnaddedRecipe) => {
    sheetRef.current?.dismiss();
    setTimeout(() => {
      editMealSheet.current?.open({
        mealPlanRecipe: entry.recipe,
        recipe: entry.recipe.recipe,
      });
    }, 150);
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
          onReview={() => handleReview(item)}
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

  const selectedCount = Math.max(0, unaddedCount - deselectedIds.size);
  const skippedCount = unaddedCount - selectedCount;
  const actionLabel = isPending
    ? 'Adding…'
    : selectedCount > 0 && skippedCount > 0
      ? `Add ${selectedCount}, Skip ${skippedCount}`
      : selectedCount > 0
        ? `Add ${selectedCount} to Grocery List`
        : 'Skip All';

  return (
    <>
      <BottomSheet
        name="add-meals-to-list-sheet"
        ref={sheetRef}
        detents={[0.85, 1]}
        scrollable
        viewClassName="flex-1"
        onDismiss={resetSelection}
        footer={
          <View className="pb-safe bg-background px-4 pt-3">
            <Button
              size="xl"
              onPress={handleAddToList}
              disabled={isPending || unaddedCount === 0}
            >
              <Text>{actionLabel}</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.SheetView className="min-h-0 flex-1 px-4">
          <BottomSheet.Header
            className="mb-1"
            title="Add to Grocery List"
            subsection={
              <BottomSheet.Subtext className="px-4">
                {summary}
              </BottomSheet.Subtext>
            }
          />

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" />
              <Text className="mt-2 text-sm text-muted-foreground">
                Loading meals…
              </Text>
            </View>
          ) : (
            <SectionList
              className="flex-1"
              sections={sections}
              renderSectionHeader={({ section }) => (
                <View className="bg-background pt-5">
                  <Text variant="overline">{section.title}</Text>
                </View>
              )}
              renderItem={renderEntry}
              keyExtractor={item => item.id}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center px-8 py-20">
                  <Text className="text-center text-lg font-semibold text-foreground">
                    Everything is already on your list
                  </Text>
                  <Text className="mt-2 text-center text-sm text-muted-foreground">
                    Add another meal to your plan when you’re ready.
                  </Text>
                </View>
              }
              contentContainerClassName="pb-28"
              contentInsetAdjustmentBehavior="automatic"
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </BottomSheet.SheetView>
      </BottomSheet>
      <EditMealSheet ref={editMealSheet} listId={listId} />
    </>
  );
}
