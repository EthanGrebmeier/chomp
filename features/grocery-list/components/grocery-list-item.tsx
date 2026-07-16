import * as Haptics from 'expo-haptics';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, type TextLayoutEvent, View } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CategoryTag } from '../../../components/category-tag';
import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { RecipeTag } from '../../../components/recipe-tag';
import { StoreTag } from '../../../components/store-tag';
import { Checkbox } from '../../../components/ui/checkbox';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { useTheme } from '../../../hooks/use-theme';
import { cn } from '../../../lib/utils';
import { CategoryOption } from '../../shared/category/categories';
import { checkListItem } from '../instant/check-list-item';
import { removeGroceryListItem } from '../instant/remove-grocery-list-item';
import { GroceryListItemWithRecipe } from '../types';

type GroceryListItemProps = {
  item: GroceryListItemWithRecipe;
  categoryOptions: CategoryOption[];
  isChecked: boolean;
  className?: string;
  onEdit?: (item: GroceryListItemWithRecipe) => void;
  isBulkSelectionModeActive?: boolean;
  isBulkSelected?: boolean;
  onToggleBulkSelection?: (itemId: string) => void;
  onEnterBulkSelectionModeWithItem?: (itemId: string) => void;
};

const SWIPE_ACTION_WIDTH = 88;
const LONG_PRESS_SUPPRESSION_MS = 750;

type SwipeDeleteActionProps = {
  drag: SharedValue<number>;
  onPress: () => void;
};

type StrikethroughLineMetrics = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type StrikethroughLineProps = {
  color: string;
  line: StrikethroughLineMetrics;
  lineIndex: number;
  progress: SharedValue<number>;
  totalLines: number;
};

const StrikethroughLine = ({
  color,
  line,
  lineIndex,
  progress,
  totalLines,
}: StrikethroughLineProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const lineProgress = Math.min(
      Math.max(progress.get() * totalLines - lineIndex, 0),
      1
    );

    return {
      width: line.width * lineProgress,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animatedStyle,
        {
          position: 'absolute',
          top: line.y + line.height / 2 - 1,
          left: line.x,
          height: 2,
          backgroundColor: color,
        },
      ]}
    />
  );
};

const SwipeDeleteAction = ({ drag, onPress }: SwipeDeleteActionProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + SWIPE_ACTION_WIDTH }],
  }));

  return (
    <Animated.View style={[animatedStyle, { width: SWIPE_ACTION_WIDTH }]}>
      <Pressable
        className="h-full items-center justify-center bg-destructive"
        onPress={onPress}
      >
        <Text className="text-sm font-semibold text-foreground">Delete</Text>
      </Pressable>
    </Animated.View>
  );
};

const GroceryListItemComponent = ({
  item,
  categoryOptions,
  isChecked,
  className,
  onEdit,
  isBulkSelectionModeActive = false,
  isBulkSelected = false,
  onToggleBulkSelection,
  onEnterBulkSelectionModeWithItem,
}: GroceryListItemProps) => {
  const [internalIsChecked, setInternalIsChecked] = useState(isChecked);
  const [strikethroughLines, setStrikethroughLines] = useState<
    StrikethroughLineMetrics[]
  >([]);
  const notes = item.notes?.trim();
  const hasMountedRef = useRef(false);
  const swipeableRef = useRef<SwipeableMethods | null>(null);
  const lastLongPressAtRef = useRef(0);

  const theme = useTheme();
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });

  // Animated value for strikethrough
  const strikethroughWidth = useSharedValue(isChecked ? 1 : 0);

  useEffect(() => {
    setInternalIsChecked(isChecked);
  }, [isChecked, item.id]);

  useEffect(() => {
    const targetValue = internalIsChecked ? 1 : 0;
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      strikethroughWidth.set(targetValue);
      return;
    }

    strikethroughWidth.set(
      withTiming(targetValue, {
        duration: 300 * Math.max(strikethroughLines.length, 1),
      })
    );
  }, [internalIsChecked, strikethroughLines.length, strikethroughWidth]);

  const handleTextLayout = useCallback((event: TextLayoutEvent) => {
    const nextLines = event.nativeEvent.lines.map(
      ({ height, width, x, y }) => ({
        height,
        width,
        x,
        y,
      })
    );

    setStrikethroughLines(previousLines => {
      const linesAreUnchanged =
        previousLines.length === nextLines.length &&
        previousLines.every((line, index) => {
          const nextLine = nextLines[index];
          return (
            line.height === nextLine.height &&
            line.width === nextLine.width &&
            line.x === nextLine.x &&
            line.y === nextLine.y
          );
        });

      return linesAreUnchanged ? previousLines : nextLines;
    });
  }, []);

  const onCheck = () => {
    swipeableRef.current?.close();

    if (isBulkSelectionModeActive) {
      onToggleBulkSelection?.(item.id);
      return;
    }

    setInternalIsChecked(previousIsChecked => {
      const nextIsChecked = !previousIsChecked;
      checkListItem({ itemId: item.id, isChecked: nextIsChecked });
      return nextIsChecked;
    });
  };

  const handleRowPress = () => {
    swipeableRef.current?.close();

    if (Date.now() - lastLongPressAtRef.current < LONG_PRESS_SUPPRESSION_MS) {
      return;
    }

    if (isBulkSelectionModeActive) {
      onToggleBulkSelection?.(item.id);
      return;
    }

    onEdit?.(item);
  };

  const handleRowLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    lastLongPressAtRef.current = Date.now();
    swipeableRef.current?.close();

    if (isBulkSelectionModeActive) {
      onToggleBulkSelection?.(item.id);
      return;
    }

    onEnterBulkSelectionModeWithItem?.(item.id);
  };

  const checkboxChecked = isBulkSelectionModeActive
    ? isBulkSelected
    : internalIsChecked;

  const handleSwipeDeletePress = useCallback(() => {
    swipeableRef.current?.close();
    removeGroceryListItem({ itemId: item.id });
  }, [item.id]);

  const renderRightActions = useCallback(
    (_: SharedValue<number>, drag: SharedValue<number>) => (
      <SwipeDeleteAction drag={drag} onPress={handleSwipeDeletePress} />
    ),
    [handleSwipeDeletePress]
  );

  const itemContent = (
    <ListItem className={className}>
      <Checkbox checked={checkboxChecked} onPress={onCheck} className="mr-1" />

      <HapticPressable
        className="flex-1 gap-1 py-1"
        onPress={handleRowPress}
        onLongPress={handleRowLongPress}
        delayLongPress={200}
        hapticType="light"
      >
        <View className="flex-row items-center justify-between ">
          <View className="relative flex-1 flex-row gap-2 pr-2">
            <View className="flex-row items-center gap-2">
              <Text
                variant="itemTitle"
                className={cn(internalIsChecked && 'text-muted-foreground')}
                style={compactTextStyle}
                onTextLayout={handleTextLayout}
              >
                {item.name}
                {'  '}
                <Text
                  variant="itemMeta"
                  className="pl-2"
                  style={compactTextStyle}
                >
                  {formatQuantityUnit(item.quantity, item.unit)}
                </Text>
              </Text>

              {strikethroughLines.map((line, index) => (
                <StrikethroughLine
                  key={`${line.x}:${line.y}`}
                  color={internalIsChecked ? theme.destructive : 'transparent'}
                  line={line}
                  lineIndex={index}
                  progress={strikethroughWidth}
                  totalLines={strikethroughLines.length}
                />
              ))}
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            {item.category ? (
              <CategoryTag
                category={item.category}
                categoryOptions={categoryOptions}
              />
            ) : null}
          </View>
        </View>
        {notes ? (
          <Text
            variant="itemDescription"
            className={cn(internalIsChecked && 'opacity-80')}
            style={compactTextStyle}
          >
            {notes}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2">
          {item.store?.name && <StoreTag name={item.store.name} />}
          {item.recipe?.name && <RecipeTag name={item.recipe.name} />}
        </View>
      </HapticPressable>
    </ListItem>
  );

  if (isBulkSelectionModeActive) {
    return itemContent;
  }

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      enableTrackpadTwoFingerGesture
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      {itemContent}
    </ReanimatedSwipeable>
  );
};

export const GroceryListItem = memo(
  GroceryListItemComponent,
  (previousProps, nextProps) => {
    return (
      previousProps.item === nextProps.item &&
      previousProps.categoryOptions === nextProps.categoryOptions &&
      previousProps.isChecked === nextProps.isChecked &&
      previousProps.className === nextProps.className &&
      previousProps.isBulkSelectionModeActive ===
        nextProps.isBulkSelectionModeActive &&
      previousProps.isBulkSelected === nextProps.isBulkSelected &&
      previousProps.onEdit === nextProps.onEdit &&
      previousProps.onToggleBulkSelection === nextProps.onToggleBulkSelection &&
      previousProps.onEnterBulkSelectionModeWithItem ===
        nextProps.onEnterBulkSelectionModeWithItem
    );
  }
);
