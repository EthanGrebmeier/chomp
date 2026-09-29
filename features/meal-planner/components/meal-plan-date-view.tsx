import * as Haptics from 'expo-haptics';
import { createContext, use, useRef, useState, type ReactNode } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
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

import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { Recipe } from '../../recipes/types';
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

import MealPlanItemCard from './meal-plan-item-card';
import MealPlanMealCard from './meal-plan-meal-card';

type DayListSection = MealPlanDayListSection<
  MealPlanRecipeWithRecipe,
  MealPlanItemWithStore
>;

type MealPlanDateViewProps = {
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

// Days rendered below the fold on first paint, in addition to the past days.
const DAY_LIST_INITIAL_FUTURE_DAYS_TO_RENDER = 8;

const ActiveDragSectionContext = createContext<SharedValue<
  number | null
> | null>(null);

// Reports each cell's layout (relative to the list content) so the list can
// scroll to today using measured positions instead of estimates.
const DayCellLayoutContext = createContext<
  ((index: number, event: LayoutChangeEvent) => void) | null
>(null);

type MealPlanDayCellProps = ViewProps & {
  index: number;
};

const MealPlanDayCell = ({
  index,
  style,
  children,
  onLayout,
  ...props
}: MealPlanDayCellProps) => {
  const activeSectionIndex = use(ActiveDragSectionContext);
  const onDayCellLayout = use(DayCellLayoutContext);
  const activeCellStyle = useAnimatedStyle(() => ({
    zIndex: activeSectionIndex?.get() === index ? 100 : 0,
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    onLayout?.(event);
    onDayCellLayout?.(index, event);
  };

  return (
    <Animated.View
      {...props}
      onLayout={handleLayout}
      style={[style, activeCellStyle]}
    >
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
  dragConfig?: MealPlanDragConfig;
};

const MealPlanMealTimeGroup = ({
  mealTime,
  groupedRecipes,
  groupedItems,
  onMealPress,
  onItemPress,
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
            contextMenuEnabled={!dragConfig}
            onMealPress={onMealPress}
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
  dragConfig?: MealPlanDragConfig;
};

const MealPlanDayContent = ({
  entries,
  onMealPress,
  onItemPress,
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
      dragConfig={dragConfig}
    />
  ));
};

type MealPlanDayListSectionViewProps = {
  section: DayListSection;
  onDayPress?: MealPlanDateViewProps['onDayPress'];
  onMealPress: MealPlanDateViewProps['onMealPress'];
  onItemPress: MealPlanDateViewProps['onItemPress'];
  onEntryDrop: (entry: MealPlanEntryIdentity, targetDate: string) => void;
  dragConfig?: MealPlanDragConfig;
};

const MealPlanDayListSectionView = ({
  section,
  onDayPress,
  onMealPress,
  onItemPress,
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
              dragConfig={dragConfig}
            />
          </View>
        ) : null}
      </View>
    </Droppable>
  );
};

export const MealPlanDateView = ({
  recipes,
  items,
  mode = 'calendar',
  dayListSections = [],
  onDayPress,
  onMealPress,
  onItemPress,
  onMoveEntry,
}: MealPlanDateViewProps) => {
  const dropProviderRef = useRef<DropProviderRef>(null);
  const dayListRef = useRef<FlatList<DayListSection>>(null);
  const [dragResetKey, setDragResetKey] = useState(0);
  const activeDragSectionIndex = useSharedValue<number | null>(null);

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

  const todaySectionIndex = dayListSections.findIndex(
    section => section.isToday
  );

  // Deliberately not using FlatList's `initialScrollIndex`: it skips rendering
  // every row above that index (the past days) and mounts them only after the
  // first scroll, so they visibly pop in. Instead, the past days render up
  // front and we scroll to today once its real position is measured.
  const hasScrolledToTodayRef = useRef(false);
  const handleDayCellLayout = (index: number, event: LayoutChangeEvent) => {
    if (hasScrolledToTodayRef.current || index !== todaySectionIndex) return;
    hasScrolledToTodayRef.current = true;
    if (index <= 0) return;
    dayListRef.current?.scrollToOffset({
      offset: event.nativeEvent.layout.y,
      animated: false,
    });
  };

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

  return mode === 'day-list' ? (
    <DropProvider ref={dropProviderRef}>
      <ActiveDragSectionContext value={activeDragSectionIndex}>
        <DayCellLayoutContext value={handleDayCellLayout}>
          <FlatList
            ref={dayListRef}
            data={dayListSections}
            keyExtractor={section => section.dateKey}
            contentContainerClassName="pb-20"
            initialNumToRender={
              Math.max(todaySectionIndex, 0) +
              DAY_LIST_INITIAL_FUTURE_DAYS_TO_RENDER
            }
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
                onEntryDrop={handleEntryDrop}
                dragConfig={dragConfig}
              />
            )}
          />
        </DayCellLayoutContext>
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
        />
      )}
    />
  );
};
