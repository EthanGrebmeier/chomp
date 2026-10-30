import * as Haptics from 'expo-haptics';
import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewProps,
} from 'react-native';
import Animated, {
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

import { cn } from '@/lib/utils';

import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { Recipe } from '../../recipes/types';
import {
  MealPlanFocusRequest,
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
} from '../utils/meal-plan-day-list';

import MealPlanItemCard from './meal-plan-item-card';
import MealPlanMealCard from './meal-plan-meal-card';

type DayListSection = MealPlanDayListSection<
  MealPlanRecipeWithRecipe,
  MealPlanItemWithStore
>;

type MealPlanDateViewProps = {
  dayListSections: DayListSection[];
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
  /** Scrolls the requested day to the top. */
  focusRequest?: MealPlanFocusRequest | null;
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

const entryTypeOrder: Record<MealPlanEntry['type'], number> = {
  recipe: 0,
  item: 1,
};

const getMealTimeRank = (entry: MealPlanEntry) =>
  mealTimeOrder.indexOf((entry.value.mealTag as MealTag | undefined) ?? 'None');

/**
 * Keeps entries that share a meal time together (in meal time order, recipes
 * before items) without rendering a heading per group; each card shows its
 * own meal time badge instead.
 */
const sortEntriesByMealTime = (entries: readonly MealPlanEntry[]) =>
  [...entries].sort(
    (a, b) =>
      getMealTimeRank(a) - getMealTimeRank(b) ||
      entryTypeOrder[a.type] - entryTypeOrder[b.type]
  );

const getEntryKey = (entry: MealPlanEntry) => `${entry.type}:${entry.id}`;

type MealPlanEntryRowProps = {
  entry: MealPlanEntry;
  onMealPress: MealPlanDateViewProps['onMealPress'];
  onItemPress: MealPlanDateViewProps['onItemPress'];
  dragConfig?: MealPlanDragConfig;
};

const MealPlanEntryRow = ({
  entry,
  onMealPress,
  onItemPress,
  dragConfig,
}: MealPlanEntryRowProps) => {
  let card: ReactNode;
  if (entry.type === 'recipe') {
    const recipe = entry.value.recipe;
    if (!recipe) return null;
    card = (
      <MealPlanMealCard
        mealPlanRecipe={entry.value}
        recipe={recipe}
        onMealPress={onMealPress}
      />
    );
  } else {
    card = (
      <MealPlanItemCard
        mealPlanItem={entry.value}
        contextMenuEnabled={!dragConfig}
        onItemPress={onItemPress}
      />
    );
  }

  if (!dragConfig) return card;

  const identity: MealPlanEntryIdentity = {
    type: entry.type,
    id: entry.id,
    date: entry.date,
  };

  return (
    <DraggableMealPlanEntry
      // Remount when the date or reset key changes so the draggable snaps back.
      key={`${identity.date}:${dragConfig.resetKey}`}
      entry={identity}
      onDragStart={dragConfig.onDragStart}
      onDragEnd={dragConfig.onDragEnd}
    >
      {card}
    </DraggableMealPlanEntry>
  );
};

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
}: MealPlanDayContentProps) =>
  sortEntriesByMealTime(entries).map(entry => (
    <MealPlanEntryRow
      key={getEntryKey(entry)}
      entry={entry}
      onMealPress={onMealPress}
      onItemPress={onItemPress}
      dragConfig={dragConfig}
    />
  ));

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
          className={cn(
            'min-h-14 justify-center px-4 py-3',
            section.entries.length > 0 && 'min-h-0 pb-1'
          )}
          onPress={() => onDayPress?.(section.dateKey)}
          accessibilityRole="button"
          accessibilityLabel={`Add to meal plan for ${section.label}`}
        >
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-xl font-semibold tracking-tight text-foreground">
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
  dayListSections,
  onDayPress,
  onMealPress,
  onItemPress,
  onMoveEntry,
  focusRequest,
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
  const todayOffset = useRef<number | null>(null);
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const scrollToTodayWhenMeasured = () => {
    if (hasScrolledToTodayRef.current || todaySectionIndex <= 0) return;
    const offset = todayOffset.current;
    // On first activation, cell layout can arrive before the list's content
    // size. Scrolling then clamps to zero and loses the intended today offset.
    if (
      offset === null ||
      offset <= 0 ||
      viewportHeight.current <= 0 ||
      contentHeight.current < offset + viewportHeight.current
    )
      return;
    hasScrolledToTodayRef.current = true;
    dayListRef.current?.scrollToOffset({ offset, animated: false });
  };
  const handleDayCellLayout = (index: number, event: LayoutChangeEvent) => {
    if (index !== todaySectionIndex) return;
    todayOffset.current = event.nativeEvent.layout.y;
    scrollToTodayWhenMeasured();
  };

  // Scroll to a requested day (from a linked grocery item). Days outside the
  // Day List window leave the scroll position alone.
  const handledFocusRequestIdRef = useRef<number | null>(null);
  const focusSectionIndex = focusRequest
    ? dayListSections.findIndex(
        section => section.dateKey === focusRequest.date
      )
    : -1;
  useEffect(() => {
    if (!focusRequest) return;
    if (handledFocusRequestIdRef.current === focusRequest.id) return;
    handledFocusRequestIdRef.current = focusRequest.id;
    if (focusSectionIndex < 0) return;
    // The requested day wins over the initial scroll to today.
    hasScrolledToTodayRef.current = true;
    dayListRef.current?.scrollToIndex({
      index: focusSectionIndex,
      animated: false,
    });
  }, [focusRequest, focusSectionIndex]);

  // Rows outside the render window have no measured offset yet: jump to an
  // estimate so they render, then retry the exact scroll.
  const handleScrollToIndexFailed = ({
    index,
    averageItemLength,
  }: {
    index: number;
    averageItemLength: number;
  }) => {
    dayListRef.current?.scrollToOffset({
      offset: averageItemLength * index,
      animated: false,
    });
    requestAnimationFrame(() => {
      dayListRef.current?.scrollToIndex({ index, animated: false });
    });
  };

  return (
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
            onLayout={event => {
              viewportHeight.current = event.nativeEvent.layout.height;
              scrollToTodayWhenMeasured();
              refreshDragDropPositions();
            }}
            onContentSizeChange={(_width, height) => {
              contentHeight.current = height;
              scrollToTodayWhenMeasured();
              refreshDragDropPositions();
            }}
            onMomentumScrollEnd={refreshDragDropPositions}
            onScrollEndDrag={refreshDragDropPositions}
            onScrollToIndexFailed={handleScrollToIndexFailed}
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
  );
};
