import {
  SectionList,
  SectionListData,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GroceryListItemWithItem } from '../types';

import { format } from 'date-fns';
import { useRef, useState } from 'react';
import Animated, { LayoutAnimationConfig } from 'react-native-reanimated';
import { EditableHeader } from '../../../components/editable-header';
import { cn } from '../../../lib/utils';
import { useUpdateGroceryList } from '../hooks/useUpdateGroceryList';
import { groupItemsBy } from '../util';
import { AddItemSheet, AddItemSheetRef } from './add-item-sheet';
import { AddRecipeSheet } from './add-recipe-sheet';
import { GroceryListItem } from './grocery-list-item';
import { GroupBySelector } from './group-by-selector';

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<GroceryListItemWithItem>
);

type GroceryListProps = {
  name: string;
  date: string;
  items: GroceryListItemWithItem[];
  groceryListId: string;
  groupBy: 'category' | 'none';
  autofocus?: boolean;
};

export const GroceryList = ({
  name,
  date,
  items,
  groceryListId,
  groupBy: initialGroupBy,
  autofocus = false,
}: GroceryListProps) => {
  const { mutate: updateList } = useUpdateGroceryList();

  const [editingItem, setEditingItem] =
    useState<GroceryListItemWithItem | null>(null);
  const [groupBy, setGroupBy] = useState<'category' | 'none'>(initialGroupBy);

  const textInputRef = useRef<TextInput>(null);
  const editSheetRef = useRef<AddItemSheetRef>(null);

  const handleChangeText = (text: string) => {
    updateList({
      listId: groceryListId,
      updates: { name: text },
    });
  };

  const handleEditItem = (item: GroceryListItemWithItem) => {
    setEditingItem(item);
    editSheetRef.current?.present();
  };

  const handleCloseEdit = () => {
    setEditingItem(null);
  };

  const handleGroupByChange = (newGroupBy: 'category' | 'none') => {
    setGroupBy(newGroupBy);
    updateList({
      listId: groceryListId,
      updates: { groupBy: newGroupBy },
    });
  };

  // Group items based on selected grouping
  const groupedItems = groupItemsBy(items, groupBy);

  // Convert Map to sections array for SectionList
  const sections: SectionListData<GroceryListItemWithItem>[] = Array.from(
    groupedItems.entries()
  ).map(([title, data]) => ({
    title,
    data,
  }));

  return (
    <View className="flex-1 gap-2">
      {/** Header */}
      <EditableHeader
        ref={textInputRef}
        value={name}
        onChangeText={handleChangeText}
        autofocus={autofocus}
      >
        <View className="flex-row items-center justify-between">
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
        </View>
      </EditableHeader>
      <View className="flex-1">
        <View className="px-4 pb-2">
          <GroupBySelector value={groupBy} onChange={handleGroupByChange} />
        </View>
        <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
          <AnimatedSectionList
            scrollEnabled={true}
            contentContainerClassName="pb-20"
            showsVerticalScrollIndicator={false}
            sections={sections}
            keyExtractor={item => item.id}
            contentContainerStyle={{ flexGrow: 1 }}
            renderSectionHeader={({ section }) => {
              if (groupBy === 'none' || !section.title) return null;
              return (
                <View className="bg-background px-4 py-2">
                  <Text className="text-lg font-semibold capitalize text-foreground">
                    {section.title}
                  </Text>
                </View>
              );
            }}
            renderItem={({ item, index, section }) => {
              const isLastInSection = index === section.data.length - 1;
              const isLastSection =
                sections.indexOf(section) === sections.length - 1;
              const showBorder = !isLastInSection || !isLastSection;

              return (
                <GroceryListItem
                  item={item}
                  isChecked={Boolean(item.isChecked)}
                  className={cn(showBorder && 'border-b border-border')}
                  onEdit={() => handleEditItem(item)}
                />
              );
            }}
          />
        </LayoutAnimationConfig>
      </View>
      <View className=" absolute bottom-4 right-4 flex-row items-center gap-2">
        <AddRecipeSheet groceryListId={groceryListId} />
        <AddItemSheet
          ref={editSheetRef}
          defaultValues={editingItem || null}
          groceryListId={groceryListId}
          onClose={handleCloseEdit}
        />
      </View>
    </View>
  );
};
