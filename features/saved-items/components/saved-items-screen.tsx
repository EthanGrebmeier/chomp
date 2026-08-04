import { PlusIcon, SearchIcon } from 'lucide-react-native';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDebounceCallback } from 'usehooks-ts';

import { Heading } from '@/components/text/heading';
import { TextInput } from '@/components/text-input';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';
import { useSettings } from '@/features/grocery-list/hooks/useSettings';
import { useUpdateSettings } from '@/features/grocery-list/hooks/useUpdateSettings';
import { useUnifiedSavedItems } from '@/features/saved-items/unified/use-unified-saved-items';

import {
  SavedItemSheetProvider,
  useSavedItemSheet,
} from './add-saved-item-sheet';
import { CategoryFilterSelector } from './category-filter-selector';
import { SavedItemsList } from './saved-items-list';
import { SavedItemsListSkeleton } from './saved-items-list-skeleton';
import { SortBySelector } from './sort-by-selector';

const SEARCH_QUERY_DEBOUNCE_MS = 300;

type SavedItemsScreenProps = {
  onBack?: () => void;
};

function SavedItemsContent({ onBack }: SavedItemsScreenProps) {
  const { data: savedItems, isLoading } = useUnifiedSavedItems();
  const { data: settings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();
  const { present } = useSavedItemSheet();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    inputKey: searchInputKey,
    defaultValue: searchDefaultValue,
    handleChangeText: handleSearchInputChange,
  } = useUncontrolledTextInput();
  const debouncedSetSearchQuery = useDebounceCallback(
    setSearchQuery,
    SEARCH_QUERY_DEBOUNCE_MS
  );

  const [sortBy, setSortBy] = useState<'name' | 'category'>(
    settings?.savedItemsSortBy ?? 'name'
  );
  const [filterCategory, setFilterCategory] = useState<string | undefined>(
    settings?.savedItemsFilterCategory ?? undefined
  );

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

  const handleSearchChange = useCallback(
    (text: string) => {
      handleSearchInputChange(text);
      debouncedSetSearchQuery(text);
    },
    [debouncedSetSearchQuery, handleSearchInputChange]
  );

  const filteredItems = useMemo(() => {
    let items = savedItems;

    if (deferredFilterCategory) {
      items = items.filter(item => item.category === deferredFilterCategory);
    }

    if (deferredSearchQuery.trim()) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      );
    }

    return items;
  }, [savedItems, deferredFilterCategory, deferredSearchQuery]);

  return (
    <View className="flex-1 bg-background pt-6">
      <View className="flex-row items-center gap-3 px-4">
        <BackButton onPress={onBack} href="/settings" />
        <Heading>My Saved Items</Heading>
      </View>

      <View className="mt-4 px-4">
        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-0 z-10 h-full justify-center">
            <Icon as={SearchIcon} size={18} className="text-muted-foreground" />
          </View>
          <TextInput
            key={searchInputKey}
            className="pl-10"
            placeholder="Search items..."
            defaultValue={searchDefaultValue}
            onChangeText={handleSearchChange}
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row gap-2 px-4 pb-2"
        className="mt-3 flex-grow-0"
      >
        <SortBySelector value={sortBy} onChange={handleSortByChange} />
        <CategoryFilterSelector
          category={filterCategory}
          onSelect={handleFilterCategoryChange}
        />
      </ScrollView>

      <View className="px-4">
        <Text variant="caption" tabularNumbers>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
          {filterCategory && !searchQuery ? ' in this category' : ''}
        </Text>
      </View>

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
}

export function SavedItemsScreen({ onBack }: SavedItemsScreenProps) {
  return (
    <SavedItemSheetProvider>
      <SavedItemsContent onBack={onBack} />
    </SavedItemSheetProvider>
  );
}
