import * as Haptics from 'expo-haptics';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
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
import { checkListItem } from '../instant/check-list-item';
import { removeGroceryListItem } from '../instant/remove-grocery-list-item';
import { GroceryListItemWithRecipe } from '../types';

type GroceryListItemProps = {
  item: GroceryListItemWithRecipe;
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
  isChecked,
  className,
  onEdit,
  isBulkSelectionModeActive = false,
  isBulkSelected = false,
  onToggleBulkSelection,
  onEnterBulkSelectionModeWithItem,
}: GroceryListItemProps) => {
  const [internalIsChecked, setInternalIsChecked] = useState(isChecked);
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
      strikethroughWidth.value = targetValue;
      return;
    }

    strikethroughWidth.value = withTiming(targetValue, {
      duration: 300,
    });
  }, [internalIsChecked, strikethroughWidth]);

  const strikethroughStyle = useAnimatedStyle(() => {
    return {
      width: `${strikethroughWidth.value * 100}%`,
    };
  });

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
                className={cn(
                  'text-xl leading-[22px] tracking-tight text-foreground',
                  internalIsChecked && 'text-muted-foreground'
                )}
                style={compactTextStyle}
              >
                {item.name}
                {'  '}
                <Text
                  className="pl-2 text-base leading-[22px] text-muted-foreground"
                  style={compactTextStyle}
                >
                  {formatQuantityUnit(item.quantity, item.unit)}
                </Text>
              </Text>

              <Animated.View
                style={[
                  strikethroughStyle,
                  {
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    height: 2,
                    backgroundColor: internalIsChecked
                      ? theme.destructive
                      : 'transparent',
                  },
                ]}
              />
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            {item.category && <CategoryTag category={item.category} />}
          </View>
        </View>
        {notes ? (
          <Text
            className={cn(
              'text-base leading-[18px] text-muted-foreground',
              internalIsChecked && 'opacity-80'
            )}
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
