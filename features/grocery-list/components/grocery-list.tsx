import { Text, TextInput, View } from 'react-native';

import { GroceryListItem as GroceryListItemType } from '../types';

import { format } from 'date-fns';
import { useRef, useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EditableHeader } from '../../../components/editable-header';
import { cn } from '../../../lib/utils';
import { useUpdateGroceryList } from '../hooks/useUpdateGroceryList';
import { AddItemSheet, AddItemSheetRef } from './add-item-sheet';
import { AddRecipeSheet } from './add-recipe-sheet';
import { GroceryListItem } from './grocery-list-item';

type GroceryListProps = {
  name: string;
  date: string;
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
  const { bottom } = useSafeAreaInsets();
  const { mutate: updateList } = useUpdateGroceryList();

  const [editingItem, setEditingItem] = useState<GroceryListItemType | null>(
    null
  );

  const textInputRef = useRef<TextInput>(null);
  const editSheetRef = useRef<AddItemSheetRef>(null);

  const handleChangeText = (text: string) => {
    updateList({
      listId: groceryListId,
      updates: { name: text },
    });
  };

  const handleEditItem = (item: GroceryListItemType) => {
    setEditingItem(item);
    editSheetRef.current?.present();
  };

  const handleCloseEdit = () => {
    setEditingItem(null);
  };

  const sortedItems = items.sort((a, b) => {
    // First sort by checked status: unchecked items first
    if (a.isChecked && !b.isChecked) return 1;
    if (!a.isChecked && b.isChecked) return -1;

    // Then sort alphabetically by name
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return (
    <View className="flex-1 gap-2">
      {/** Header */}
      <EditableHeader
        ref={textInputRef}
        value={name}
        onChangeText={handleChangeText}
        autofocus={autofocus}
      >
        <View className="flex-row gap-4">
          <Text className="text-lg text-muted-foreground">
            {items.length} items
          </Text>
          {date && (
            <Text className="text-lg text-muted-foreground">
              {format(date, 'EEEE, M/d/yy')}
            </Text>
          )}
        </View>
      </EditableHeader>
      <View className="flex-1">
        <Animated.FlatList
          scrollEnabled={true}
          itemLayoutAnimation={LinearTransition}
          contentContainerClassName="pb-20"
          showsVerticalScrollIndicator={false}
          data={sortedItems}
          keyExtractor={item => item.id}
          contentContainerStyle={{ flexGrow: 1 }}
          renderItem={({ item, index }) => (
            <GroceryListItem
              item={item}
              isChecked={Boolean(item.isChecked)}
              className={cn(
                index < items.length - 1 && 'border-b border-border'
              )}
              onEdit={() => handleEditItem(item)}
            />
          )}
        />
      </View>
      <View
        style={{ bottom: bottom + 16 }}
        className=" absolute right-4 flex-row items-center gap-2"
      >
        <AddRecipeSheet groceryListId={groceryListId} />
        <AddItemSheet
          ref={editSheetRef}
          defaultValues={editingItem}
          groceryListId={groceryListId}
          onClose={handleCloseEdit}
        />
      </View>
    </View>
  );
};
