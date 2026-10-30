import * as Haptics from 'expo-haptics';
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { CategoryTag } from '../../../components/category-tag';
import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { RecipeTag } from '../../../components/recipe-tag';
import { StoreTag } from '../../../components/store-tag';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import {
  SwipeToDelete,
  type SwipeToDeleteHandle,
} from '../../../components/ui/swipe-to-delete';
import { Text } from '../../../components/ui/text';
import { TogglePressable } from '../../../components/ui/toggle-pressable';
import { useTheme } from '../../../hooks/use-theme';
import { CategoryOption } from '../../shared/category/categories';
import { checkListItem } from '../instant/check-list-item';
import { removeGroceryListItem } from '../instant/remove-grocery-list-item';
import { GroceryListItemWithRecipe } from '../types';
import { groceryItemSourceLabel } from '../util';

import { GroceryItemCheckbox } from './grocery-item-checkbox';

type GroceryListItemProps = {
  item: GroceryListItemWithRecipe;
  categoryOptions: CategoryOption[];
  isChecked: boolean;
  className?: string;
  hideOrganizationTags?: boolean;
  rowPressAction?: 'edit' | 'toggleChecked';
  onEdit?: (item: GroceryListItemWithRecipe) => void;
  isBulkSelectionModeActive?: boolean;
  isBulkSelected?: boolean;
  onToggleBulkSelection?: (itemId: string) => void;
  onEnterBulkSelectionModeWithItem?: (itemId: string) => void;
};

const LONG_PRESS_SUPPRESSION_MS = 750;

const GroceryListItemComponent = ({
  item,
  categoryOptions,
  isChecked,
  className,
  hideOrganizationTags = false,
  rowPressAction = 'edit',
  onEdit,
  isBulkSelectionModeActive = false,
  isBulkSelected = false,
  onToggleBulkSelection,
  onEnterBulkSelectionModeWithItem,
}: GroceryListItemProps) => {
  const [pendingCheck, setPendingCheck] = useState<{
    checked: boolean;
    attempt: number;
  } | null>(null);
  const displayedChecked = pendingCheck?.checked ?? isChecked;
  const checkAttemptRef = useRef(0);
  const notes = item.notes?.trim();
  const sourceLabel = groceryItemSourceLabel(item);
  const swipeableRef = useRef<SwipeToDeleteHandle | null>(null);
  const lastLongPressAtRef = useRef(0);

  const theme = useTheme();
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });

  const animatedChecked = useSharedValue(displayedChecked);
  useLayoutEffect(() => {
    animatedChecked.set(displayedChecked);
  }, [animatedChecked, displayedChecked]);

  const onCheck = async (checked: boolean) => {
    swipeableRef.current?.close();
    if (isBulkSelectionModeActive) {
      onToggleBulkSelection?.(item.id);
      return;
    }

    const attempt = ++checkAttemptRef.current;
    setPendingCheck({ checked, attempt });
    try {
      await checkListItem({ itemId: item.id, isChecked: checked });
    } catch {
      toast.error('Could not save item. Check your connection and try again.');
    }
    // Older saves cannot clear feedback for a newer tap. Model publication
    // precedes completion, so releasing local intent also handles rollback.
    setPendingCheck(current => (current?.attempt === attempt ? null : current));
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

    if (rowPressAction === 'toggleChecked') {
      void onCheck(!displayedChecked);
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
    : displayedChecked;

  const handleSwipeDeletePress = useCallback(() => {
    removeGroceryListItem({ item }).catch(() => {
      toast.error(
        'Could not delete item. Check your connection and try again.'
      );
    });
  }, [item]);

  const rowContent = (
    <>
      <View className="flex-row  justify-between ">
        <View className="relative flex-1 flex-row gap-2 pr-2">
          <View className="flex-row items-center gap-2">
            <Text
              variant="itemTitle"
              style={[
                compactTextStyle,
                {
                  color: displayedChecked
                    ? theme.mutedForeground
                    : theme.foreground,
                  textDecorationLine: displayedChecked
                    ? 'line-through'
                    : 'none',
                  textDecorationColor: theme.destructive,
                },
              ]}
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
          </View>
        </View>
        <View className="flex-row gap-2">
          {!hideOrganizationTags && item.category ? (
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
          className="-my-0.5"
          style={[compactTextStyle, { opacity: displayedChecked ? 0.8 : 1 }]}
        >
          {notes}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2">
        {!hideOrganizationTags && item.store?.name && (
          <StoreTag name={item.store.name} />
        )}
        {sourceLabel ? <RecipeTag name={sourceLabel} /> : null}
      </View>
    </>
  );

  const itemContent = (
    <ListItem className={className}>
      <GroceryItemCheckbox
        key={`${item.id}:${isBulkSelectionModeActive}`}
        checked={checkboxChecked}
        animatedChecked={
          isBulkSelectionModeActive ? undefined : animatedChecked
        }
        onChange={onCheck}
      />

      {rowPressAction === 'toggleChecked' && !isBulkSelectionModeActive ? (
        <TogglePressable
          className="flex-1 gap-0.5 py-1"
          checked={displayedChecked}
          animatedChecked={animatedChecked}
          onChange={checked => void onCheck(checked)}
          onLongPress={
            onEnterBulkSelectionModeWithItem ? handleRowLongPress : undefined
          }
        >
          {rowContent}
        </TogglePressable>
      ) : (
        <HapticPressable
          className="flex-1 gap-0.5 py-1"
          onPress={handleRowPress}
          onLongPress={
            onEnterBulkSelectionModeWithItem || isBulkSelectionModeActive
              ? handleRowLongPress
              : undefined
          }
          accessibilityRole={
            rowPressAction === 'toggleChecked' ? 'checkbox' : 'button'
          }
          accessibilityState={
            rowPressAction === 'toggleChecked'
              ? { checked: displayedChecked }
              : undefined
          }
          delayLongPress={200}
          hapticType="light"
        >
          {rowContent}
        </HapticPressable>
      )}
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

// FlashList may reuse a cell for another item when checked sections change.
// Keep the cell memoized, but give its stateful contents an item lifetime: queued
// gestures and save completions from the old item must never mutate the new one.
// The key stays stable when the same item toggles or moves between sections.
export const GroceryListItem = memo(
  function GroceryListItem(props: GroceryListItemProps) {
    return <GroceryListItemComponent key={props.item.id} {...props} />;
  },
  (previousProps, nextProps) => {
    return (
      previousProps.item === nextProps.item &&
      previousProps.rowPressAction === nextProps.rowPressAction &&
      previousProps.hideOrganizationTags === nextProps.hideOrganizationTags &&
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
