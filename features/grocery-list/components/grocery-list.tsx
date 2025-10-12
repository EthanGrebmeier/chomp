import { Text, TextInput, View } from 'react-native';

import { GroceryListItem as GroceryListItemType } from '../types';

import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useDebounceCallback } from 'usehooks-ts';
import { TextDisplayInput } from '../../../components/text-input';
import { cn } from '../../../lib/utils';
import { useUpdateGroceryList } from '../hooks/useUpdateGroceryList';
import { AddItemSheet } from './add-item-sheet';
import { AddRecipeSheet } from './add-recipe-sheet';
import { GroceryListItem } from './grocery-list-item';

type GroceryListProps = {
  name: string;
  date?: string;
  items: GroceryListItemType[];
  groceryListId: string;
  autofocus?: boolean;
};

export const GroceryList = ({
  name,
  date,
  items,
  groceryListId,
  autofocus = false,
}: GroceryListProps) => {
  const { mutate: updateList } = useUpdateGroceryList();
  const hasClearedName = useRef(false);
  const previousText = useRef(name);

  const [listName, setListName] = useState(name);
  const textInputRef = useRef<TextInput>(null);

  const debouncedUpdateDbList = useDebounceCallback(updateList, 500);

  useEffect(() => {
    if (autofocus && textInputRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [autofocus]);

  const updateName = (text: string) => {
    setListName(text);
    debouncedUpdateDbList({
      listId: groceryListId,
      updates: { name: text },
    });
  };

  const handleChangeText = (text: string) => {
    // Check if backspace was pressed (text got shorter)
    if (
      autofocus &&
      !hasClearedName.current &&
      previousText.current.length > text.length &&
      text.length === 0
    ) {
      // If backspace was pressed and we're in autofocus mode, clear the entire title
      updateName('');
      hasClearedName.current = true;
      previousText.current = '';
    } else {
      updateName(text);
      previousText.current = text;
    }
  };

  const sortedItems = items.sort((a, b) => {
    // First sort by checked status: unchecked items first
    if (a.isChecked && !b.isChecked) return 1;
    if (!a.isChecked && b.isChecked) return -1;

    // Then sort alphabetically by name
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return (
    <View className="flex-1 gap-4">
      {/** Header */}
      <View className="px-4">
        <TextDisplayInput
          ref={textInputRef}
          onChangeText={handleChangeText}
          value={listName}
          multiline
          className="align-text-top text-3xl font-bold"
        />
        <View className="mt-2 flex-row gap-4">
          <Text className="text-lg text-muted-foreground">
            {items.length} items
          </Text>
          {date && (
            <Text className="text-lg text-muted-foreground">
              {format(new Date(date + 'T00:00:00'), 'EEEE, M/d/yy')}
            </Text>
          )}
        </View>
      </View>
      <Animated.FlatList
        className="flex-1"
        scrollEnabled
        itemLayoutAnimation={LinearTransition}
        showsVerticalScrollIndicator={false}
        data={sortedItems}
        renderItem={({ item, index }) => (
          <GroceryListItem
            key={item.id}
            item={item}
            isChecked={Boolean(item.isChecked)}
            className={cn(index < items.length - 1 && 'border-b border-border')}
          />
        )}
      />
      <View className="absolute bottom-4 right-4 flex-row gap-2">
        <AddRecipeSheet groceryListId={groceryListId} />
        <AddItemSheet groceryListId={groceryListId} />
      </View>
    </View>
  );
};
