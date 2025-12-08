import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Image } from 'expo-image';
import { PlusIcon } from 'lucide-react-native';
import { forwardRef, useRef, useState } from 'react';
import {
  ScrollViewProps,
  SectionList,
  SectionListData,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import {
  KeyboardAwareScrollView,
  KeyboardController,
} from 'react-native-keyboard-controller';
import Animated, { LayoutAnimationConfig } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { cn } from '../../../lib/utils';
import { AddItemNew } from '../../shared/add-item-new';
import { ItemFormData } from '../../shared/components';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { clearGroceryList } from '../db/clear-list';
import { useCreateSeparateGroceryListItem } from '../hooks/useCreateSeparateGroceryListItem';
import { useIncrementGroceryListItem } from '../hooks/useIncrementGroceryListItem';
import { useUpdateSettings } from '../hooks/useUpdateSettings';
import { addGroceryListItem } from '../instant/add-grocery-list-item';
import { updateGroceryListItem } from '../instant/update-grocery-list-item';
import { useGroceryListItems } from '../instant/use-grocery-list-items';
import { BaseGroceryItem, GroceryListItemWithRecipe } from '../types';
import { groupItemsBy } from '../util';

import { AddItemConflictSheet } from './add-item-conflict-sheet';
import { AddRecipeSheet, AddRecipeSheetRef } from './add-recipe-sheet';
import { ClearListConfirmationSheet } from './clear-list-confirmation-sheet';
import { CollapsibleSectionHeader } from './collapsible-section-header';
import { GroceryListHeader } from './grocery-list-header';
import { GroceryListItem } from './grocery-list-item';
import { GroupBySelector } from './group-by-selector';
import { SortBySelector } from './sort-by-selector';
import { UpdateItemSheet, UpdateItemSheetRef } from './update-item-sheet';

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<GroceryListItemWithRecipe>
);

type GroceryListProps = {
  listId: string;
  listName?: string;
  items: GroceryListItemWithRecipe[];
  groupBy: 'category' | 'none' | 'recipe';
  sortBy: 'name' | 'recent';
  onTitlePress?: () => void;
};

const RenderScrollComponent = forwardRef<ScrollView, ScrollViewProps>(
  (props, ref) => <KeyboardAwareScrollView {...props} ref={ref} />
);

RenderScrollComponent.displayName = 'RenderScrollComponent';

export const GroceryList = ({
  listId,
  listName,
  groupBy: initialGroupBy,
  sortBy: initialSortBy,
  onTitlePress,
}: GroceryListProps) => {
  const [isItemSheetOpen, setIsItemSheetOpen] = useState(false);
  const recipeSheetRef = useRef<AddRecipeSheetRef>(null);
  const { mutate: updateSettings } = useUpdateSettings();

  const { mutate: incrementItem } = useIncrementGroceryListItem();
  const { mutate: createSeparateItem } = useCreateSeparateGroceryListItem();

  const { data } = useGroceryListItems(listId);
  const items = data?.grocery_items ?? [];

  const handleAddItem = (item: BaseGroceryItem) => {
    addGroceryListItem({
      listId,
      item: {
        ...item,
        quantity: 1,
        unit: 'each',
        isChecked: false,
      },
    });
  };

  const handleUpdateItem = (item: ItemFormData) => {
    const { quantity, ...rest } = item;
    if (!editingItem) return;
    updateGroceryListItem({
      itemId: editingItem.id,
      item: { quantity: parseInt(quantity), ...rest },
    });
    updateItemSheetRef.current?.dismiss();
    KeyboardController.dismiss();
  };

  const [editingItem, setEditingItem] =
    useState<GroceryListItemWithRecipe | null>(null);
  const [conflictItem, setConflictItem] = useState<{
    existingItemId: string;
    newItem: BaseGroceryItem;
  } | null>(null);
  const [groupBy, setGroupBy] = useState<'category' | 'none' | 'recipe'>(
    initialGroupBy
  );
  const [sortBy, setSortBy] = useState<'name' | 'recent'>(initialSortBy);
  // Track which sections are collapsed by their title
  // By default, all sections start expanded
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(['Checked']) // Start with checked items collapsed
  );

  const updateItemSheetRef = useRef<UpdateItemSheetRef>(null);
  const addItemConflictSheetRef = useRef<TrueSheet | null>(null);
  const clearListConfirmationSheetRef = useRef<TrueSheet | null>(null);
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
    updateItemSheetRef.current?.present();
  };

  const handleGroupByChange = (newGroupBy: 'category' | 'none' | 'recipe') => {
    setGroupBy(newGroupBy);
    updateSettings({ groupBy: newGroupBy });
  };

  const handleSortByChange = (newSortBy: 'name' | 'recent') => {
    setSortBy(newSortBy);
    updateSettings({ sortBy: newSortBy });
  };

  const handleIncrementExistingItem = () => {
    if (!conflictItem) return;

    incrementItem(
      {
        itemId: conflictItem.existingItemId,
        quantityToAdd: 1,
      },
      {
        onSuccess: () => {
          toast.success(`Quantity updated for ${conflictItem.newItem.name}`);
          addItemConflictSheetRef.current?.dismiss();
          setConflictItem(null);
        },
      }
    );
  };

  const handleCreateSeparateItem = () => {
    if (!conflictItem) return;

    createSeparateItem(
      {
        name: conflictItem.newItem.name,
        quantity: 1,
        unit: 'each',
        category: conflictItem.newItem.category,
      },
      {
        onSuccess: () => {
          toast.success(`${conflictItem.newItem.name} added as separate item`);
          addItemConflictSheetRef.current?.dismiss();
          setConflictItem(null);
        },
      }
    );
  };

  const handleCancelConflict = () => {
    addItemConflictSheetRef.current?.dismiss();
    setConflictItem(null);
  };

  const handleClearListPress = () => {
    clearListConfirmationSheetRef.current?.present();
  };

  const handleConfirmClearList = () => {
    clearGroceryList({ listId });
  };

  const handleCancelClearList = () => {
    clearListConfirmationSheetRef.current?.dismiss();
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
    <>
      <View className="flex-1 gap-2">
        {/** Header */}
        <GroceryListHeader
          listId={listId}
          itemCount={items.length}
          listName={listName}
          openRecipeSheet={() => recipeSheetRef.current?.present()}
          onClearListPress={handleClearListPress}
          onTitlePress={onTitlePress}
        />
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

          {items.length === 0 ? (
            <View className="flex-1 items-center justify-center ">
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
          ) : (
            <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
              <AnimatedSectionList
                scrollEnabled={true}
                onScroll={() => setIsItemSheetOpen(false)}
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
                    itemCount = groupedUncheckedItems.get(
                      section.title
                    )?.length;
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
                      onEdit={() => handleEditItem(item)}
                    />
                  );
                }}
              />
            </LayoutAnimationConfig>
          )}
        </View>
        <AddRecipeSheet ref={recipeSheetRef} />
        <UpdateItemSheet
          showButton={false}
          defaultValues={editingItem}
          ref={updateItemSheetRef}
          onUpdate={handleUpdateItem}
        />
        <AddItemConflictSheet
          ref={addItemConflictSheetRef}
          onIncrement={handleIncrementExistingItem}
          onCreateSeparate={handleCreateSeparateItem}
          onCancel={handleCancelConflict}
        />
        <ClearListConfirmationSheet
          ref={clearListConfirmationSheetRef}
          onConfirm={handleConfirmClearList}
          onCancel={handleCancelClearList}
        />
        <View
          className="absolute right-4 z-20"
          style={{ bottom: NATIVE_TABS_OFFSET }}
        >
          <Button
            size="iconLg"
            onPress={() => {
              setIsItemSheetOpen(true);
            }}
          >
            <Icon
              as={PlusIcon}
              size={28}
              strokeWidth={3}
              className="text-primary-foreground"
            />
          </Button>
        </View>
      </View>
      <AddItemNew
        isOpen={isItemSheetOpen}
        setIsOpen={setIsItemSheetOpen}
        onAddItem={handleAddItem}
        bottomOffset={NATIVE_TABS_OFFSET}
      />
    </>
  );
};
