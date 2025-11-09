import {
  SectionList,
  SectionListData,
  Text,
  View,
} from 'react-native';

import { GroceryListItemWithRecipe } from '../types';

import { useRef, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { LayoutAnimationConfig } from 'react-native-reanimated';
import { Heading } from '../../../components/text/heading';
import { cn } from '../../../lib/utils';
import { useUpdateSettings } from '../hooks/useUpdateSettings';
import { groupItemsBy } from '../util';
import { AddItemSheet, AddItemSheetRef } from './add-item-sheet';
import { AddRecipeSheet } from './add-recipe-sheet';
import { CollapsibleSectionHeader } from './collapsible-section-header';
import { GroceryListItem } from './grocery-list-item';
import { GroupBySelector } from './group-by-selector';
import { SortBySelector } from './sort-by-selector';

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<GroceryListItemWithRecipe>
);

type GroceryListProps = {
  items: GroceryListItemWithRecipe[];
  groupBy: 'category' | 'none' | 'recipe';
  sortBy: 'name' | 'recent';
};

export const GroceryList = ({
  items,
  groupBy: initialGroupBy,
  sortBy: initialSortBy,
}: GroceryListProps) => {
  const { mutate: updateSettings } = useUpdateSettings();

  const [editingItem, setEditingItem] =
    useState<GroceryListItemWithRecipe | null>(null);
  const [groupBy, setGroupBy] = useState<'category' | 'none' | 'recipe'>(
    initialGroupBy
  );
  const [sortBy, setSortBy] = useState<'name' | 'recent'>(initialSortBy);
  // Track which sections are collapsed by their title
  // By default, all sections start expanded
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(['Checked']) // Start with checked items collapsed
  );

  const editSheetRef = useRef<AddItemSheetRef>(null);

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  const handleEditItem = (item: GroceryListItemWithRecipe) => {
    setEditingItem(item);
    editSheetRef.current?.present();
  };

  const handleCloseEdit = () => {
    setEditingItem(null);
  };

  const handleGroupByChange = (newGroupBy: 'category' | 'none' | 'recipe') => {
    setGroupBy(newGroupBy);
    updateSettings({ groupBy: newGroupBy });
  };

  const handleSortByChange = (newSortBy: 'name' | 'recent') => {
    setSortBy(newSortBy);
    updateSettings({ sortBy: newSortBy });
  };

  // Separate checked and unchecked items
  const uncheckedItems = items.filter(item => !item.isChecked);
  let checkedItems = items.filter(item => item.isChecked);

  // Sort checked items based on selected sorting
  if (sortBy === 'recent') {
    checkedItems = checkedItems.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  } else {
    checkedItems = checkedItems.sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
      });
    });
  }

  // Group unchecked items based on selected grouping
  const groupedUncheckedItems = groupItemsBy(uncheckedItems, groupBy, sortBy);

  // Convert Map to sections array for SectionList
  const sections: SectionListData<GroceryListItemWithRecipe>[] = Array.from(
    groupedUncheckedItems.entries()
  ).map(([title, data]) => {
    const isCollapsed = collapsedSections.has(title);
    return {
      title,
      data: isCollapsed ? [] : data,
    };
  });

  // Add checked items section at the bottom if there are any checked items
  if (checkedItems.length > 0) {
    const isCollapsed = collapsedSections.has('Checked');
    sections.push({
      title: 'Checked',
      data: isCollapsed ? [] : checkedItems,
    });
  }

  return (
    <View className="flex-1 gap-2">
      {/** Header */}
      <View className="px-4">
        <Heading>Shopping List</Heading>
        <Text className="text-lg text-muted-foreground">
          {items.length} items
        </Text>
      </View>
      <View className="flex-1">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row gap-2 px-4 pb-2"
          className="flex-grow-0"
        >
          <GroupBySelector value={groupBy} onChange={handleGroupByChange} />
          <SortBySelector value={sortBy} onChange={handleSortByChange} />
        </ScrollView>
        <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
          <AnimatedSectionList
            scrollEnabled={true}
            contentContainerClassName="pb-20"
            showsVerticalScrollIndicator={false}
            sections={sections}
            keyExtractor={item => item.id}
            contentContainerStyle={{ flexGrow: 1 }}
            renderSectionHeader={({ section }) => {
              if (groupBy === 'none' && !section.title) return null;

              const isCollapsed = collapsedSections.has(section.title);
              const isExpanded = !isCollapsed;

              // Get the item count for this section from the grouped items
              let itemCount: number | undefined;
              if (section.title === 'Checked') {
                itemCount = checkedItems.length;
              } else {
                itemCount = groupedUncheckedItems.get(section.title)?.length;
              }

              return (
                <CollapsibleSectionHeader
                  title={section.title}
                  itemCount={itemCount}
                  isExpanded={isExpanded}
                  onToggle={() => toggleSection(section.title)}
                  showCollapse={true}
                />
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
      <View className=" absolute bottom-4 left-4 right-4 flex-row items-center justify-between gap-2">
        <View></View>
        <View className="flex-row gap-2">
          <AddRecipeSheet />
          <AddItemSheet
            ref={editSheetRef}
            defaultValues={editingItem || null}
            onClose={handleCloseEdit}
          />
        </View>
      </View>
    </View>
  );
};
