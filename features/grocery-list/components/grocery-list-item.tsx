import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CategoryTag } from '../../../components/category-tag';
import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { RecipeTag } from '../../../components/recipe-tag';
import { StoreTag } from '../../../components/store-tag';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
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
  onEdit?: () => void;
};

export const GroceryListItem = ({
  item,
  isChecked,
  className,
  onEdit,
}: GroceryListItemProps) => {
  const [internalIsChecked, setInternalIsChecked] = useState(isChecked);
  const notes = item.notes?.trim();
  const checkItemTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const theme = useTheme();

  // Animated value for strikethrough
  const strikethroughWidth = useSharedValue(isChecked ? 1 : 0);

  useEffect(() => {
    strikethroughWidth.value = withTiming(internalIsChecked ? 1 : 0, {
      duration: 300,
    });
  }, [internalIsChecked]);

  const strikethroughStyle = useAnimatedStyle(() => {
    return {
      width: `${strikethroughWidth.value * 100}%`,
    };
  });

  const onCheck = () => {
    if (checkItemTimeoutRef.current) {
      clearTimeout(checkItemTimeoutRef.current);
    }
    if (internalIsChecked) {
      checkListItem({ itemId: item.id, isChecked: false });
    } else {
      checkItemTimeoutRef.current = setTimeout(() => {
        checkListItem({ itemId: item.id, isChecked: true });
      }, 1000);
    }
    setInternalIsChecked(!internalIsChecked);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeGroceryListItem({ itemId: item.id }),
        },
      ]
    );
  };

  return (
    <ContextMenuRoot
      trigger={
        <ListItem
          onDelete={() => removeGroceryListItem({ itemId: item.id })}
          className={className}
        >
          <Checkbox
            checked={internalIsChecked}
            onPress={onCheck}
            className="mr-1"
          />

          <HapticPressable
            className="flex-1 gap-1"
            onPress={onEdit}
            hapticType="light"
          >
            <View className="flex-row items-center justify-between ">
              <View className="relative flex-1 pr-2">
                <Text
                  className={cn(
                    'text-xl font-medium text-foreground',
                    internalIsChecked && 'text-muted-foreground'
                  )}
                >
                  {item.name}
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
              <Text className="text-base text-muted-foreground">
                {formatQuantityUnit(item.quantity, item.unit)}
              </Text>
            </View>
            {notes ? (
              <Text
                className={cn(
                  'text-base leading-none text-muted-foreground',
                  internalIsChecked && 'opacity-80'
                )}
              >
                {notes}
              </Text>
            ) : null}
            <View className="flex-row items-center gap-2 ">
              {item.category && <CategoryTag category={item.category} />}
              {item.store?.name && <StoreTag name={item.store.name} />}
              {item.recipe?.name && <RecipeTag name={item.recipe.name} />}
            </View>
          </HapticPressable>
        </ListItem>
      }
    >
      <ContextMenuItem
        key="delete-grocery-item"
        destructive
        onSelect={handleDelete}
      >
        <ContextMenuItemTitle>Delete Item</ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
};
