import { useRecyclingState } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useLayoutEffect, useRef } from 'react';
import { Platform, View, type TextLayoutEvent } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { CategoryTag } from '../../../components/category-tag';
import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { RecipeTag } from '../../../components/recipe-tag';
import { StoreTag } from '../../../components/store-tag';
import { Checkbox } from '../../../components/ui/checkbox';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import {
  SwipeToDelete,
  type SwipeToDeleteHandle,
} from '../../../components/ui/swipe-to-delete';
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

const LONG_PRESS_SUPPRESSION_MS = 750;

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

const StrikethroughLine = memo(function StrikethroughLine({
  color,
  line,
  lineIndex,
  progress,
  totalLines,
}: StrikethroughLineProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const lineProgress = Math.min(
      Math.max(progress.get() * totalLines - lineIndex, 0),
      1
    );

    return {
      // Keep the left edge fixed without changing layout on every frame.
      // Transform-only updates bypass the shadow tree (see the Reanimated
      // `*_SYNCHRONOUSLY_UPDATE_UI_PROPS` flags in package.json), so React
      // commits from the check-off re-render cannot pause this animation.
      transform: [
        { translateX: ((lineProgress - 1) * line.width) / 2 },
        { scaleX: lineProgress },
      ],
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
          width: line.width,
          height: 2,
          backgroundColor: color,
        },
      ]}
    />
  );
});

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
  const [strikethroughLines, setStrikethroughLines] = useRecyclingState<
    StrikethroughLineMetrics[]
  >([], [item.id]);
  const notes = item.notes?.trim();
  const animationTargetRef = useRef({ itemId: item.id, isChecked });
  const lastObservedCheckedStateRef = useRef({ itemId: item.id, isChecked });
  const checkAttemptRef = useRef(0);
  const swipeableRef = useRef<SwipeToDeleteHandle | null>(null);
  const lastLongPressAtRef = useRef(0);

  const theme = useTheme();
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });

  // Both animations receive local intent before the list re-renders.
  const animatedChecked = useSharedValue(isChecked);
  const strikethroughWidth = useSharedValue(isChecked ? 1 : 0);

  const strokeDuration = 200 * Math.max(strikethroughLines.length, 1);
  // Create and advance the animation on the UI runtime. Re-renders and text
  // measurements must not create a fresh timing animation for the same intent.
  useAnimatedReaction(
    () => animatedChecked.get(),
    (checked, previousChecked) => {
      if (previousChecked === null || checked === previousChecked) {
        return;
      }
      strikethroughWidth.set(
        withTiming(checked ? 1 : 0, {
          duration: strokeDuration,
          // Ease the whole stroke, not each line, so multi-line items do not
          // stall at line breaks. Quad keeps the last line from crawling.
          easing: Easing.out(Easing.quad),
        })
      );
    }
  );

  const animateCheckedState = useCallback(
    (checked: boolean) => {
      animationTargetRef.current = { itemId: item.id, isChecked: checked };
      animatedChecked.set(checked);
    },
    [animatedChecked, item.id]
  );

  useLayoutEffect(() => {
    const previousObserved = lastObservedCheckedStateRef.current;
    lastObservedCheckedStateRef.current = { itemId: item.id, isChecked };

    if (previousObserved.itemId !== item.id) {
      // FlashList can recycle this row for an entirely different item.
      checkAttemptRef.current += 1;
      animationTargetRef.current = { itemId: item.id, isChecked };
      animatedChecked.set(isChecked);
      strikethroughWidth.set(isChecked ? 1 : 0);
    } else if (
      previousObserved.isChecked !== isChecked &&
      animationTargetRef.current.isChecked !== isChecked
    ) {
      // Only a changed prop can override local intent. Text-layout updates
      // must not reverse a tap while the controlled prop is catching up.
      animateCheckedState(isChecked);
    }
  }, [
    animateCheckedState,
    animatedChecked,
    isChecked,
    item.id,
    strikethroughWidth,
  ]);

  const handleTextLayout = useCallback(
    (event: TextLayoutEvent) => {
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
      }, true);
    },
    [setStrikethroughLines]
  );

  const onCheck = () => {
    swipeableRef.current?.close();

    if (isBulkSelectionModeActive) {
      onToggleBulkSelection?.(item.id);
      return;
    }

    const nextChecked = !animationTargetRef.current.isChecked;
    const attempt = ++checkAttemptRef.current;
    // Start on the UI runtime before publishing intent and updating the list.
    animateCheckedState(nextChecked);

    void checkListItem({
      itemId: item.id,
      isChecked: nextChecked,
    }).catch(() => {
      if (checkAttemptRef.current === attempt) {
        animateCheckedState(isChecked);
      }
      toast.error('Could not save item. Check your connection and try again.');
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
    : isChecked;

  const handleSwipeDeletePress = useCallback(() => {
    removeGroceryListItem({ item }).catch(() => {
      toast.error(
        'Could not delete item. Check your connection and try again.'
      );
    });
  }, [item]);

  const itemContent = (
    <ListItem className={className}>
      <Checkbox
        checked={checkboxChecked}
        animatedChecked={
          isBulkSelectionModeActive ? undefined : animatedChecked
        }
        onPress={onCheck}
        className="mr-1"
      />

      <HapticPressable
        className="flex-1 gap-0.5 py-1"
        onPress={handleRowPress}
        onLongPress={handleRowLongPress}
        delayLongPress={200}
        hapticType="light"
      >
        <View className="flex-row  justify-between ">
          <View className="relative flex-1 flex-row gap-2 pr-2">
            <View className="flex-row items-center gap-2">
              <Text
                variant="itemTitle"
                className={cn(isChecked && 'text-muted-foreground')}
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
                  color={theme.destructive}
                  line={line}
                  lineIndex={index}
                  progress={strikethroughWidth}
                  totalLines={strikethroughLines.length}
                />
              ))}
            </View>
          </View>
          <View className="flex-row gap-2">
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
            className={cn('-my-0.5', isChecked && 'opacity-80')}
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
    <SwipeToDelete ref={swipeableRef} onDelete={handleSwipeDeletePress}>
      {itemContent}
    </SwipeToDelete>
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
