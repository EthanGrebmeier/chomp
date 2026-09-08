import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  Draggable,
  DropProvider,
  Droppable,
  type DropProviderRef,
} from 'react-native-reanimated-dnd';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { IngredientSelector } from '../../../components/item-sheet/add-item/ingredient-selector';
import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { Button } from '../../../components/ui/button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Pill } from '../../../components/ui/pill';
import { Text } from '../../../components/ui/text';
import { type ListView } from '../../grocery-list/components/list-view-tabs';
import { Recipe } from '../../recipes/types';
import { useAddMealsToGroceryList, useUnmarkMealAdded } from '../hooks';
import { getReconciledMealPlanSnapshotRows } from '../instant/get-reconciled-meal-plan-snapshot-rows';
import { MealPlanIngredientSnapshotStore } from '../instant/meal-plan-ingredient-snapshot-store';
import {
  MealPlanIngredientEditorRow,
  applyMealPlanIngredientOverride,
  getSelectedSourceIngredientIds,
  hydrateMealPlanIngredientEditorFromSnapshot,
  toggleAllMealPlanIngredientSelection,
  toggleMealPlanIngredientSelection,
} from '../meal-plan-recipe-ingredient-editor';
import {
  MealPlanItemWithStore,
  MealPlanRecipe,
  MealPlanRecipeWithRecipe,
  MealTag,
} from '../types';
import {
  MealPlanDayListEntry,
  MealPlanDayListSection,
  MealPlanEntryIdentity,
  MoveMealPlanEntry,
  createMealPlanDayEntries,
} from '../utils/meal-plan-day-list';

import {
  MealPlanIngredientOverrideSheet,
  MealPlanIngredientOverrideSheetRef,
} from './meal-plan-ingredient-override-sheet';
import MealPlanItemCard from './meal-plan-item-card';
import MealPlanMealCard from './meal-plan-meal-card';

type DayListSection = MealPlanDayListSection<
  MealPlanRecipeWithRecipe,
  MealPlanItemWithStore
>;

type MealPlanDateViewProps = {
  listId: string;
  recipes: MealPlanRecipeWithRecipe[];
  items: MealPlanItemWithStore[];
  mode?: 'calendar' | 'day-list';
  dayListSections?: DayListSection[];
  onDayPress?: (dateKey: string) => void;
  onMealPress: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipe;
    recipe: Recipe;
  }) => void;
  onItemPress: (item: MealPlanItemWithStore) => void;
  onMoveEntry?: MoveMealPlanEntry;
  onViewChange?: (view: ListView) => void;
};

const mealTimeOrder: MealTag[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'None',
];

type MealPlanEntry = MealPlanDayListEntry<
  MealPlanRecipeWithRecipe,
  MealPlanItemWithStore
>;

const dragStyles = StyleSheet.create({
  activeDraggable: {
    zIndex: 100,
  },
  activeDropTarget: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
});

const MEAL_PLAN_DRAG_LONG_PRESS_MS = 300;
const DROP_HIGHLIGHT_ENTER_MS = 60;
const DROP_HIGHLIGHT_EXIT_DELAY_MS = 50;
const DROP_HIGHLIGHT_EXIT_MS = 100;

const ActiveDragSectionContext = createContext<SharedValue<
  number | null
> | null>(null);

type MealPlanDayCellProps = ViewProps & {
  index: number;
};

const MealPlanDayCell = ({
  index,
  style,
  children,
  ...props
}: MealPlanDayCellProps) => {
  const activeSectionIndex = use(ActiveDragSectionContext);
  const activeCellStyle = useAnimatedStyle(() => ({
    zIndex: activeSectionIndex?.get() === index ? 100 : 0,
  }));

  return (
    <Animated.View {...props} style={[style, activeCellStyle]}>
      {children}
    </Animated.View>
  );
};

type MealPlanDragConfig = {
  resetKey: number;
  onDragStart: (entry: MealPlanEntryIdentity) => void;
  onDragEnd: () => void;
};

type DraggableMealPlanEntryProps = {
  entry: MealPlanEntryIdentity;
  children: ReactNode;
  onDragStart: MealPlanDragConfig['onDragStart'];
  onDragEnd: MealPlanDragConfig['onDragEnd'];
};

const DraggableMealPlanEntry = ({
  entry,
  onDragStart,
  onDragEnd,
  children,
}: DraggableMealPlanEntryProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (draggedEntry: MealPlanEntryIdentity) => {
    setIsDragging(true);
    onDragStart(draggedEntry);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  return (
    <Draggable
      data={entry}
      draggableId={`${entry.type}:${entry.id}`}
      dragAxis="y"
      collisionAlgorithm="center"
      preDragDelay={MEAL_PLAN_DRAG_LONG_PRESS_MS}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={isDragging ? dragStyles.activeDraggable : undefined}
    >
      <View className={isDragging ? 'bg-background/70' : undefined}>
        {children}
      </View>
    </Draggable>
  );
};

const groupEntriesByMealTime = (entries: readonly MealPlanEntry[]) => {
  const groupedRecipes = {} as Record<MealTag, MealPlanRecipeWithRecipe[]>;
  const groupedItems = {} as Record<MealTag, MealPlanItemWithStore[]>;

  entries.forEach(entry => {
    const tag = (entry.value.mealTag as MealTag) || 'None';
    if (entry.type === 'recipe') {
      groupedRecipes[tag] = [...(groupedRecipes[tag] ?? []), entry.value];
    } else {
      groupedItems[tag] = [...(groupedItems[tag] ?? []), entry.value];
    }
  });

  return {
    groupedRecipes,
    groupedItems,
    mealTimesWithContent: mealTimeOrder.filter(
      mealTime =>
        (groupedRecipes[mealTime]?.length ?? 0) +
          (groupedItems[mealTime]?.length ?? 0) >
        0
    ),
  };
};

type MealPlanMealTimeGroupProps = {
  mealTime: MealTag;
  groupedRecipes: Record<MealTag, MealPlanRecipeWithRecipe[]>;
  groupedItems: Record<MealTag, MealPlanItemWithStore[]>;
  onMealPress: MealPlanDateViewProps['onMealPress'];
  onItemPress: MealPlanDateViewProps['onItemPress'];
  onRecipeIndicatorPress: (recipe: MealPlanRecipeWithRecipe) => void;
  onItemIndicatorPress: (item: MealPlanItemWithStore) => void;
  dragConfig?: MealPlanDragConfig;
};

const MealPlanMealTimeGroup = ({
  mealTime,
  groupedRecipes,
  groupedItems,
  onMealPress,
  onItemPress,
  onRecipeIndicatorPress,
  onItemIndicatorPress,
  dragConfig,
}: MealPlanMealTimeGroupProps) => (
  <View className="mb-2">
    <Text className="px-4 text-lg font-semibold capitalize text-muted-foreground">
      {mealTime === 'None' ? 'No Mealtime' : mealTime}
    </Text>
    <View>
      {groupedRecipes[mealTime]?.map((mealPlanRecipe, index) => {
        const recipe = mealPlanRecipe.recipe;
        if (!recipe) return null;
        const recipesCount = groupedRecipes[mealTime]?.length ?? 0;
        const itemsCount = groupedItems[mealTime]?.length ?? 0;
        const isLast = index === recipesCount - 1 && itemsCount === 0;
        const card = (
          <MealPlanMealCard
            key={mealPlanRecipe.id}
            mealPlanRecipe={mealPlanRecipe}
            recipe={recipe}
            isLast={isLast}
            onMealPress={onMealPress}
            onIndicatorPress={onRecipeIndicatorPress}
          />
        );

        if (!dragConfig) return card;

        const entry: MealPlanEntryIdentity = {
          type: 'recipe',
          id: mealPlanRecipe.id,
          date: mealPlanRecipe.date,
        };

        return (
          <DraggableMealPlanEntry
            key={`${entry.type}:${entry.id}:${entry.date}:${dragConfig.resetKey}`}
            entry={entry}
            onDragStart={dragConfig.onDragStart}
            onDragEnd={dragConfig.onDragEnd}
          >
            {card}
          </DraggableMealPlanEntry>
        );
      })}
      {groupedItems[mealTime]?.map((mealPlanItem, index) => {
        const card = (
          <MealPlanItemCard
            key={mealPlanItem.id}
            mealPlanItem={mealPlanItem}
            isLast={index === (groupedItems[mealTime]?.length ?? 0) - 1}
            contextMenuEnabled={!dragConfig}
            onItemPress={onItemPress}
            onIndicatorPress={onItemIndicatorPress}
          />
        );

        if (!dragConfig) return card;

        const entry: MealPlanEntryIdentity = {
          type: 'item',
          id: mealPlanItem.id,
          date: mealPlanItem.date,
        };

        return (
          <DraggableMealPlanEntry
            key={`${entry.type}:${entry.id}:${entry.date}:${dragConfig.resetKey}`}
            entry={entry}
            onDragStart={dragConfig.onDragStart}
            onDragEnd={dragConfig.onDragEnd}
          >
            {card}
          </DraggableMealPlanEntry>
        );
      })}
    </View>
  </View>
);

type MealPlanDayContentProps = {
  entries: readonly MealPlanEntry[];
  onMealPress: MealPlanDateViewProps['onMealPress'];
  onItemPress: MealPlanDateViewProps['onItemPress'];
  onRecipeIndicatorPress: (recipe: MealPlanRecipeWithRecipe) => void;
  onItemIndicatorPress: (item: MealPlanItemWithStore) => void;
  dragConfig?: MealPlanDragConfig;
};

const MealPlanDayContent = ({
  entries,
  onMealPress,
  onItemPress,
  onRecipeIndicatorPress,
  onItemIndicatorPress,
  dragConfig,
}: MealPlanDayContentProps) => {
  const { groupedRecipes, groupedItems, mealTimesWithContent } =
    groupEntriesByMealTime(entries);

  return mealTimesWithContent.map(mealTime => (
    <MealPlanMealTimeGroup
      key={mealTime}
      mealTime={mealTime}
      groupedRecipes={groupedRecipes}
      groupedItems={groupedItems}
      onMealPress={onMealPress}
      onItemPress={onItemPress}
      onRecipeIndicatorPress={onRecipeIndicatorPress}
      onItemIndicatorPress={onItemIndicatorPress}
      dragConfig={dragConfig}
    />
  ));
};

type MealPlanDayListSectionViewProps = {
  section: DayListSection;
  onDayPress?: MealPlanDateViewProps['onDayPress'];
  onMealPress: MealPlanDateViewProps['onMealPress'];
  onItemPress: MealPlanDateViewProps['onItemPress'];
  onRecipeIndicatorPress: (recipe: MealPlanRecipeWithRecipe) => void;
  onItemIndicatorPress: (item: MealPlanItemWithStore) => void;
  onEntryDrop: (entry: MealPlanEntryIdentity, targetDate: string) => void;
  dragConfig?: MealPlanDragConfig;
};

const MealPlanDayListSectionView = ({
  section,
  onDayPress,
  onMealPress,
  onItemPress,
  onRecipeIndicatorPress,
  onItemIndicatorPress,
  onEntryDrop,
  dragConfig,
}: MealPlanDayListSectionViewProps) => {
  const dropHighlightProgress = useSharedValue(0);
  const dropHighlightStyle = useAnimatedStyle(() => ({
    opacity: dropHighlightProgress.get(),
  }));

  const handleDrop = (entry: MealPlanEntryIdentity) => {
    onEntryDrop(entry, section.dateKey);
  };

  const handleActiveChange = (isActive: boolean) => {
    dropHighlightProgress.set(
      isActive
        ? withTiming(1, { duration: DROP_HIGHLIGHT_ENTER_MS })
        : withDelay(
            DROP_HIGHLIGHT_EXIT_DELAY_MS,
            withTiming(0, { duration: DROP_HIGHLIGHT_EXIT_MS })
          )
    );
  };

  return (
    <Droppable
      droppableId={`meal-plan-day:${section.dateKey}`}
      onDrop={handleDrop}
      onActiveChange={handleActiveChange}
      capacity={Number.MAX_SAFE_INTEGER}
    >
      <View className="min-h-14">
        <Animated.View
          pointerEvents="none"
          style={[dragStyles.activeDropTarget, dropHighlightStyle]}
        />
        <HapticPressable
          className="min-h-14 justify-center  px-4 py-3"
          onPress={() => onDayPress?.(section.dateKey)}
          accessibilityRole="button"
          accessibilityLabel={`Add to meal plan for ${section.label}`}
        >
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-lg font-semibold text-foreground">
              {section.label}
            </Text>
            {section.isToday ? (
              <View className="rounded-full bg-primary/15 px-2.5 py-1">
                <Text className="text-xs font-semibold text-primary">
                  Today
                </Text>
              </View>
            ) : null}
          </View>
        </HapticPressable>
        {section.entries.length > 0 ? (
          <View className="border-b border-border">
            <MealPlanDayContent
              entries={section.entries}
              onMealPress={onMealPress}
              onItemPress={onItemPress}
              onRecipeIndicatorPress={onRecipeIndicatorPress}
              onItemIndicatorPress={onItemIndicatorPress}
              dragConfig={dragConfig}
            />
          </View>
        ) : null}
      </View>
    </Droppable>
  );
};

export const MealPlanDateView = ({
  listId,
  recipes,
  items,
  mode = 'calendar',
  dayListSections = [],
  onDayPress,
  onMealPress,
  onItemPress,
  onMoveEntry,
  onViewChange,
}: MealPlanDateViewProps) => {
  const { mutate: addMealsToGroceryList, isPending: isAddingToList } =
    useAddMealsToGroceryList();
  const { mutate: unmarkMealAdded } = useUnmarkMealAdded();
  const quickReviewSheetRef = useRef<TrueSheet>(null);
  const ingredientOverrideSheetRef =
    useRef<MealPlanIngredientOverrideSheetRef>(null);
  const dropProviderRef = useRef<DropProviderRef>(null);
  const [quickReviewMealPlanRecipe, setQuickReviewMealPlanRecipe] =
    useState<MealPlanRecipeWithRecipe | null>(null);
  const [dragResetKey, setDragResetKey] = useState(0);
  const activeDragSectionIndex = useSharedValue<number | null>(null);
  const queryClient = useQueryClient();

  const refreshDragDropPositions = () => {
    dropProviderRef.current?.requestPositionUpdate();
  };

  const handleDragStart = (entry: MealPlanEntryIdentity) => {
    const sectionIndex = dayListSections.findIndex(
      section => section.dateKey === entry.date
    );
    activeDragSectionIndex.set(sectionIndex >= 0 ? sectionIndex : null);
    refreshDragDropPositions();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDragEnd = () => {
    activeDragSectionIndex.set(null);
  };

  const handleEntryDrop = (
    entry: MealPlanEntryIdentity,
    targetDate: string
  ) => {
    if (!onMoveEntry || entry.date === targetDate) {
      setDragResetKey(current => current + 1);
      return;
    }

    // The date change remounts only the moved draggable. Resetting here would
    // remount every row before that update arrives, causing a visible flicker.
    void Promise.resolve(onMoveEntry(entry, targetDate))
      .then(() => {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      })
      .catch(() => {
        setDragResetKey(current => current + 1);
        toast.error('Failed to move meal');
      });
  };

  const dragConfig: MealPlanDragConfig | undefined = onMoveEntry
    ? {
        resetKey: dragResetKey,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
      }
    : undefined;

  const quickReviewRecipe = quickReviewMealPlanRecipe?.recipe ?? null;
  const quickReviewQueryKey = useMemo(
    () => [
      'meal-plan-quick-review-rows',
      quickReviewMealPlanRecipe?.id ?? null,
    ],
    [quickReviewMealPlanRecipe?.id]
  );

  const {
    data: quickReviewIngredientRows = [],
    isPending: isLoadingQuickReviewIngredients,
  } = useQuery<MealPlanIngredientEditorRow[]>({
    queryKey: quickReviewQueryKey,
    enabled: Boolean(quickReviewMealPlanRecipe && quickReviewRecipe),
    queryFn: async () => {
      if (!quickReviewMealPlanRecipe || !quickReviewRecipe) {
        return [];
      }
      const snapshotRows = await getReconciledMealPlanSnapshotRows(
        quickReviewMealPlanRecipe.id
      );

      return hydrateMealPlanIngredientEditorFromSnapshot({
        sourceIngredients: quickReviewRecipe.recipe_ingredients ?? [],
        snapshotRows,
      });
    },
  });

  const setQuickReviewQueryRows = useCallback(
    (
      updater: (
        rows: MealPlanIngredientEditorRow[]
      ) => MealPlanIngredientEditorRow[]
    ) => {
      queryClient.setQueryData<MealPlanIngredientEditorRow[]>(
        quickReviewQueryKey,
        prev => updater(prev ?? [])
      );
    },
    [queryClient, quickReviewQueryKey]
  );

  const quickReviewSelectionMutation = useMutation({
    mutationFn: ({
      snapshotRowId,
      isSelected,
    }: {
      snapshotRowId: string;
      isSelected: boolean;
    }) =>
      MealPlanIngredientSnapshotStore.updateRowSelection({
        snapshotRowId,
        isSelected,
      }),
  });

  const quickReviewOverrideMutation = useMutation({
    mutationFn: ({
      snapshotRowId,
      updates,
    }: {
      snapshotRowId: string;
      updates: {
        name: string;
        quantity: number;
        unit: string;
        notes?: string | null;
        category?: string | null;
        storeId?: string;
        isQuantityOverridden: boolean;
      };
    }) =>
      MealPlanIngredientSnapshotStore.updateRowOverrides({
        snapshotRowId,
        updates,
      }),
  });

  const selectedQuickReviewIngredientIds = useMemo(
    () => getSelectedSourceIngredientIds(quickReviewIngredientRows),
    [quickReviewIngredientRows]
  );

  const closeQuickReviewSheet = useCallback(() => {
    quickReviewSheetRef.current?.dismiss();
  }, []);

  const handleQuickReviewDismiss = useCallback(() => {
    setQuickReviewMealPlanRecipe(null);
    ingredientOverrideSheetRef.current?.dismiss();
  }, []);

  const handleOpenQuickReview = useCallback(
    (mealPlanRecipe: MealPlanRecipeWithRecipe) => {
      setQuickReviewMealPlanRecipe(mealPlanRecipe);
      quickReviewSheetRef.current?.present();
    },
    []
  );

  const handleToggleQuickReviewIngredientSelection = useCallback(
    async (sourceRecipeIngredientId: string) => {
      const currentRow = quickReviewIngredientRows.find(
        row => row.sourceRecipeIngredientId === sourceRecipeIngredientId
      );
      if (!currentRow?.snapshotRowId) return;

      const previousIsSelected = currentRow.isSelected;
      const nextIsSelected = !previousIsSelected;

      setQuickReviewQueryRows(rows =>
        toggleMealPlanIngredientSelection(rows, sourceRecipeIngredientId)
      );

      try {
        await quickReviewSelectionMutation.mutateAsync({
          snapshotRowId: currentRow.snapshotRowId,
          isSelected: nextIsSelected,
        });
      } catch {
        setQuickReviewQueryRows(rows =>
          rows.map(row =>
            row.sourceRecipeIngredientId === sourceRecipeIngredientId
              ? { ...row, isSelected: previousIsSelected }
              : row
          )
        );
        toast.error('Failed to save ingredient selection');
      }
    },
    [
      quickReviewIngredientRows,
      quickReviewSelectionMutation,
      setQuickReviewQueryRows,
    ]
  );

  const handleToggleAllQuickReviewIngredientSelections =
    useCallback(async () => {
      if (quickReviewIngredientRows.length === 0) return;

      const previousRows = quickReviewIngredientRows;
      const nextRows = toggleAllMealPlanIngredientSelection(previousRows);
      const nextIsSelected = nextRows[0]?.isSelected ?? true;

      setQuickReviewQueryRows(() => nextRows);
      try {
        await Promise.all(
          previousRows
            .filter(row => row.snapshotRowId)
            .map(row =>
              quickReviewSelectionMutation.mutateAsync({
                snapshotRowId: row.snapshotRowId as string,
                isSelected: nextIsSelected,
              })
            )
        );
      } catch {
        setQuickReviewQueryRows(() => previousRows);
        toast.error('Failed to save ingredient selections');
      }
    }, [
      quickReviewIngredientRows,
      quickReviewSelectionMutation,
      setQuickReviewQueryRows,
    ]);

  const handleEditQuickReviewIngredient = useCallback(
    (sourceRecipeIngredientId: string) => {
      const row = quickReviewIngredientRows.find(
        ingredientRow =>
          ingredientRow.sourceRecipeIngredientId === sourceRecipeIngredientId
      );
      if (!row) return;
      ingredientOverrideSheetRef.current?.present(row);
    },
    [quickReviewIngredientRows]
  );

  const handleConfirmQuickAdd = useCallback(() => {
    if (!quickReviewMealPlanRecipe || isAddingToList) return;

    addMealsToGroceryList(
      {
        listId,
        selectedRecipeIds: [quickReviewMealPlanRecipe.id],
      },
      {
        onSuccess: result => {
          const totalAdded = result.addedRecipes + result.addedItems;
          if (totalAdded === 0) {
            toast.info('Already added to list');
          } else {
            onViewChange?.('grocery-list');
          }
          closeQuickReviewSheet();
        },
        onError: () => {
          toast.error('Failed to add to list');
        },
      }
    );
  }, [
    addMealsToGroceryList,
    closeQuickReviewSheet,
    isAddingToList,
    listId,
    onViewChange,
    quickReviewMealPlanRecipe,
  ]);

  const handleIndicatorPress = useCallback(
    (
      type: 'recipe' | 'item',
      id: string,
      name: string,
      addedToList: boolean
    ) => {
      if (isAddingToList) return;

      if (addedToList) {
        Alert.alert(
          'Already Added',
          `"${name}" has already been added to a grocery list. Would you like to mark it as unadded?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Mark as Unadded',
              onPress: () => unmarkMealAdded({ type, id }),
            },
          ]
        );
      } else {
        if (type === 'recipe') {
          const mealPlanRecipe = recipes.find(recipe => recipe.id === id);
          if (!mealPlanRecipe) {
            toast.error('Recipe not found');
            return;
          }
          handleOpenQuickReview(mealPlanRecipe);
          return;
        }

        const args = { listId, selectedItemIds: [id] };

        addMealsToGroceryList(args, {
          onSuccess: result => {
            const totalAdded = result.addedRecipes + result.addedItems;
            if (totalAdded === 0) {
              toast.info('Already added to list');
            }
          },
          onError: () => {
            toast.error('Failed to add to list');
          },
        });
      }
    },
    [
      addMealsToGroceryList,
      handleOpenQuickReview,
      isAddingToList,
      listId,
      recipes,
      unmarkMealAdded,
    ]
  );

  const handleRecipeIndicatorPress = useCallback(
    (mealPlanRecipe: MealPlanRecipeWithRecipe) => {
      const name = mealPlanRecipe.recipe.name;
      handleIndicatorPress(
        'recipe',
        mealPlanRecipe.id,
        name,
        !!mealPlanRecipe.addedToList
      );
    },
    [recipes, handleIndicatorPress]
  );

  const handleItemIndicatorPress = useCallback(
    (mealPlanItem: MealPlanItemWithStore) => {
      handleIndicatorPress(
        'item',
        mealPlanItem.id,
        mealPlanItem.name,
        !!mealPlanItem.addedToList
      );
    },
    [handleIndicatorPress]
  );

  const calendarEntries = createMealPlanDayEntries(recipes, items);
  const calendarGroups = groupEntriesByMealTime(calendarEntries);

  // Empty state when no meals or items
  if (mode === 'calendar' && calendarGroups.mealTimesWithContent.length === 0) {
    return (
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(140)}
        className="flex-1 items-center justify-center px-4"
      >
        <View className="-mt-24">
          <EmptyHeading className="mt-4">No meals planned</EmptyHeading>
          <EmptySubtext>Tap the + button to add a meal</EmptySubtext>
        </View>
      </Animated.View>
    );
  }

  return (
    <>
      {mode === 'day-list' ? (
        <DropProvider ref={dropProviderRef}>
          <ActiveDragSectionContext value={activeDragSectionIndex}>
            <FlatList
              data={dayListSections}
              keyExtractor={section => section.dateKey}
              contentContainerClassName="pb-20"
              initialNumToRender={8}
              windowSize={5}
              CellRendererComponent={MealPlanDayCell}
              onLayout={refreshDragDropPositions}
              onContentSizeChange={refreshDragDropPositions}
              onMomentumScrollEnd={refreshDragDropPositions}
              onScrollEndDrag={refreshDragDropPositions}
              renderItem={({ item: section }) => (
                <MealPlanDayListSectionView
                  section={section}
                  onDayPress={onDayPress}
                  onMealPress={onMealPress}
                  onItemPress={onItemPress}
                  onRecipeIndicatorPress={handleRecipeIndicatorPress}
                  onItemIndicatorPress={handleItemIndicatorPress}
                  onEntryDrop={handleEntryDrop}
                  dragConfig={dragConfig}
                />
              )}
            />
          </ActiveDragSectionContext>
        </DropProvider>
      ) : (
        <FlatList
          contentContainerClassName="pb-20"
          data={calendarGroups.mealTimesWithContent}
          keyExtractor={item => item}
          renderItem={({ item: mealTime }) => (
            <MealPlanMealTimeGroup
              mealTime={mealTime}
              groupedRecipes={calendarGroups.groupedRecipes}
              groupedItems={calendarGroups.groupedItems}
              onMealPress={onMealPress}
              onItemPress={onItemPress}
              onRecipeIndicatorPress={handleRecipeIndicatorPress}
              onItemIndicatorPress={handleItemIndicatorPress}
            />
          )}
        />
      )}
      <BottomSheet
        name="meal-plan-quick-review-sheet"
        ref={quickReviewSheetRef}
        detents={[0.9]}
        viewClassName="flex-1"
        scrollable
        onDismiss={handleQuickReviewDismiss}
        footer={
          <BottomSheet.SheetView className="pb-safe flex-row gap-2 px-4 pt-3">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={closeQuickReviewSheet}
            >
              <Text>Cancel</Text>
            </Button>
            <Button
              className="flex-1"
              onPress={handleConfirmQuickAdd}
              disabled={isAddingToList}
            >
              <Text>{isAddingToList ? 'Adding...' : 'Add Meal to List'}</Text>
            </Button>
          </BottomSheet.SheetView>
        }
      >
        <BottomSheet.SheetView className="pb-safe flex-1">
          <View className="min-h-0 flex-1">
            <BottomSheet.Header
              className="mb-2"
              title="Add meal to grocery list"
              description={
                quickReviewMealPlanRecipe
                  ? `Confirm the ingredients from ${quickReviewMealPlanRecipe.recipe.name} to add to your grocery list`
                  : undefined
              }
            />
            {quickReviewRecipe ? (
              <View className="-mx-4 min-h-0 flex-1">
                <IngredientSelector
                  recipe={quickReviewRecipe}
                  mode="meal-plan"
                  showHeader={false}
                  showFooter={false}
                  bottomContentInset={96}
                  onBack={closeQuickReviewSheet}
                  onDismiss={closeQuickReviewSheet}
                  selectedIds={selectedQuickReviewIngredientIds}
                  onToggleIngredient={id => {
                    void handleToggleQuickReviewIngredientSelection(id);
                  }}
                  onToggleAll={() => {
                    void handleToggleAllQuickReviewIngredientSelections();
                  }}
                  onEditIngredient={handleEditQuickReviewIngredient}
                />
              </View>
            ) : null}
            {isLoadingQuickReviewIngredients ||
            quickReviewSelectionMutation.isPending ||
            quickReviewOverrideMutation.isPending ? (
              <View className="px-4 pb-4">
                <Pill hasValue>
                  {isLoadingQuickReviewIngredients
                    ? 'Loading ingredient selections...'
                    : quickReviewOverrideMutation.isPending
                      ? 'Saving ingredient override...'
                      : 'Saving ingredient selections...'}
                </Pill>
              </View>
            ) : null}
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
      <MealPlanIngredientOverrideSheet
        ref={ingredientOverrideSheetRef}
        onSave={async ({ sourceRecipeIngredientId, updates }) => {
          const currentRow = quickReviewIngredientRows.find(
            row => row.sourceRecipeIngredientId === sourceRecipeIngredientId
          );
          if (!currentRow?.snapshotRowId) {
            throw new Error('Snapshot row not found');
          }

          setQuickReviewQueryRows(rows =>
            rows.map(row =>
              row.sourceRecipeIngredientId === sourceRecipeIngredientId
                ? applyMealPlanIngredientOverride({ row, updates })
                : row
            )
          );
          try {
            await quickReviewOverrideMutation.mutateAsync({
              snapshotRowId: currentRow.snapshotRowId,
              updates,
            });
          } catch (error) {
            setQuickReviewQueryRows(rows =>
              rows.map(row =>
                row.sourceRecipeIngredientId === sourceRecipeIngredientId
                  ? currentRow
                  : row
              )
            );
            throw error;
          }
        }}
      />
    </>
  );
};
