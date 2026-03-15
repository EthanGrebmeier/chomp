import { PlusIcon, SearchIcon } from 'lucide-react-native';
import { useDeferredValue, useMemo, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { TextInput } from '@/components/text-input';
import { Heading } from '@/components/text/heading';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useSettings } from '@/features/grocery-list/hooks/useSettings';
import { useUpdateSettings } from '@/features/grocery-list/hooks/useUpdateSettings';
import {
  SavedItemSheetProvider,
  useSavedItemSheet,
} from '@/features/saved-items/components/add-saved-item-sheet';
import { CategoryFilterSelector } from '@/features/saved-items/components/category-filter-selector';
import { SavedItemsList } from '@/features/saved-items/components/saved-items-list';
import { SavedItemsListSkeleton } from '@/features/saved-items/components/saved-items-list-skeleton';
import { SortBySelector } from '@/features/saved-items/components/sort-by-selector';
import { useUnifiedSavedItems } from '@/features/saved-items/unified/use-unified-saved-items';

const SavedItemsContent = () => {
  const { data: savedItems, isLoading } = useUnifiedSavedItems();
  const { data: settings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();
  const { present } = useSavedItemSheet();
  const [searchQuery, setSearchQuery] = useState('');

  const [sortBy, setSortBy] = useState<'name' | 'category'>(
    settings?.savedItemsSortBy ?? 'name'
  );
  const [filterCategory, setFilterCategory] = useState<string | undefined>(
    settings?.savedItemsFilterCategory ?? undefined
  );

  // Defer filter values to keep UI responsive during filtering/sorting
  const deferredSortBy = useDeferredValue(sortBy);
  const deferredFilterCategory = useDeferredValue(filterCategory);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const handleSortByChange = (newSortBy: 'name' | 'category') => {
    setSortBy(newSortBy);
    updateSettings({ savedItemsSortBy: newSortBy });
  };

  const handleFilterCategoryChange = (category?: string) => {
    setFilterCategory(category);
    updateSettings({ savedItemsFilterCategory: category ?? null });
  };

  const filteredItems = useMemo(() => {
    let items = savedItems;

    // Apply category filter
    if (deferredFilterCategory) {
      items = items.filter(item => item.category === deferredFilterCategory);
    }

    // Apply search filter
    if (deferredSearchQuery.trim()) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      );
    }

    return items;
  }, [savedItems, deferredFilterCategory, deferredSearchQuery]);

  return (
    <View className="flex-1 bg-background pt-6">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4">
        <BackButton href="/settings" />
        <Heading>My Saved Items</Heading>
      </View>

      {/* Search */}
      <View className="mt-4 px-4">
        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-0 z-10 h-full justify-center">
            <Icon as={SearchIcon} size={18} className="text-muted-foreground" />
          </View>
          <TextInput
            className="pl-10"
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Sort and Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row gap-2 px-4 pb-2"
        className=" mt-3 flex-grow-0"
      >
        <SortBySelector value={sortBy} onChange={handleSortByChange} />
        <CategoryFilterSelector
          category={filterCategory}
          onSelect={handleFilterCategoryChange}
        />
      </ScrollView>

      {/* Item count */}
      <View className="px-4">
        <Text className="text-sm text-muted-foreground">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
          {filterCategory && !searchQuery && ' in this category'}
        </Text>
      </View>

      {/* List */}
      <View className="mt-2 flex-1">
        {isLoading ? (
          <Animated.View
            key="skeleton"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <SavedItemsListSkeleton />
          </Animated.View>
        ) : (
          <Animated.View
            key="content"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <SavedItemsList
              items={filteredItems}
              sortBy={deferredSortBy}
              onEditItem={present}
            />
          </Animated.View>
        )}
      </View>

      {/* Add button */}
      <View className="absolute bottom-6 right-6 z-20">
        <Button size="wide-small" onPress={() => present()}>
          <Icon
            as={PlusIcon}
            size={28}
            strokeWidth={3}
            className="text-primary-foreground"
          />
        </Button>
      </View>
    </View>
  );
};

export default function SavedItemsPage() {
  return (
    <SavedItemSheetProvider>
      <SavedItemsContent />
    </SavedItemSheetProvider>
  );
}
