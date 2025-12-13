import { Image } from 'expo-image';
import { useState } from 'react';
import { SectionList, SectionListData, View } from 'react-native';
import Animated, { LayoutAnimationConfig } from 'react-native-reanimated';

import { useEditItemSheet } from '../../../components/item-sheet/edit-item/edit-item-sheet';
import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { cn } from '../../../lib/utils';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { GroceryListItemWithRecipe } from '../types';
import { groupItemsBy } from '../util';

import { CollapsibleSectionHeader } from './collapsible-section-header';
import { GroceryListItem } from './grocery-list-item';

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<GroceryListItemWithRecipe>
);

type GroceryItemsListProps = {
  items: GroceryListItemWithRecipe[];
  groupBy: 'category' | 'none' | 'recipe';
  sortBy: 'name' | 'recent';
};

export const GroceryItemsList = ({
  items,
  groupBy,
  sortBy,
}: GroceryItemsListProps) => {
  const { present: presentEditSheet } = useEditItemSheet();

  // Track which sections are collapsed by their title
  // By default, all sections start expanded except "Checked"
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(['Checked'])
  );

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

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <View
          className="w-64"
          style={{
            marginTop: -NATIVE_TABS_OFFSET,
          }}
        >
          <Image
            source={require('../../../assets/images/grocery-basket.png')}
            style={{
              width: 'auto',
              height: 180,
            }}
            contentFit="contain"
          />
        </View>
        <View>
          <EmptyHeading className="px-4">
            Your grocery list is empty
          </EmptyHeading>
          <EmptySubtext className="px-4">
            Add some items to get started!
          </EmptySubtext>
        </View>
      </View>
    );
  }

  return (
    <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
      <AnimatedSectionList
        scrollEnabled={true}
        contentContainerClassName="pb-36"
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
              className={cn(
                showBorder && 'border-b border-dashed border-border'
              )}
              onEdit={() => {
                presentEditSheet(item);
              }}
            />
          );
        }}
      />
    </LayoutAnimationConfig>
  );
};
