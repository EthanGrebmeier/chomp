import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDebounceCallback } from 'usehooks-ts';

import { SHEET_TOP_STYLE } from '@/components/sheet-content';
import { SheetHeader } from '@/components/sheet-header';
import { AddButton } from '@/components/ui/add-button';
import { BackButton } from '@/components/ui/back-button';
import { SearchButton } from '@/components/ui/search-button';
import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';
import { useSettings } from '@/features/grocery-list/hooks/useSettings';
import { useUpdateSettings } from '@/features/grocery-list/hooks/useUpdateSettings';
import { useUnifiedSavedItems } from '@/features/saved-items/unified/use-unified-saved-items';

import {
  SavedItemSheetProvider,
  useSavedItemSheet,
} from './add-saved-item-sheet';
import { type SavedItemsSortOption } from './saved-items-filter-dropdown-menu';
import { SavedItemsFilters } from './saved-items-filters';
import { SavedItemsList } from './saved-items-list';
import { SavedItemsListSkeleton } from './saved-items-list-skeleton';

const SEARCH_QUERY_DEBOUNCE_MS = 300;

type SavedItemsScreenProps = {
  onBack?: () => void;
};

function SavedItemsContent({ onBack }: SavedItemsScreenProps) {
  const { data: savedItems, isLoading } = useUnifiedSavedItems();
  const { data: settings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();
  const { present } = useSavedItemSheet();
  const [searchMode, setSearchMode] = useState(false);
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

  const [sortBy, setSortBy] = useState<SavedItemsSortOption>(
    settings?.savedItemsSortBy ?? 'name'
  );
  const [filterCategory, setFilterCategory] = useState<string | undefined>(
    settings?.savedItemsFilterCategory ?? undefined
  );

  const deferredSortBy = useDeferredValue(sortBy);
  const deferredFilterCategory = useDeferredValue(filterCategory);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const dismissSearch = () => Keyboard.dismiss();

  const handleSortByChange = (newSortBy: SavedItemsSortOption) => {
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

  const hasActiveFilters =
    !!searchQuery.trim() || !!filterCategory || sortBy !== 'name';

  return (
    <Pressable
      className="flex-1 bg-background"
      style={SHEET_TOP_STYLE}
      accessible={false}
      onPress={dismissSearch}
    >
      <SheetHeader
        title="My Saved Items"
        subtitle={`${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}${searchQuery ? ` matching "${searchQuery}"` : filterCategory ? ' in this category' : ''}`}
        backAction={<BackButton onPress={onBack} href="/settings" />}
        primaryAction={
          <View className="flex-row items-center gap-2">
            <SearchButton
              accessibilityLabel="Search saved items"
              onPress={() => setSearchMode(value => !value)}
              hasActiveFilters={hasActiveFilters}
            />
            <AddButton
              accessibilityLabel="Add saved item"
              onPress={() => present()}
            />
          </View>
        }
      />
      {searchMode ? (
        <Animated.View
          className="px-8"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <SavedItemsFilters
            searchInputKey={searchInputKey}
            searchDefaultValue={searchDefaultValue}
            onSearchChange={handleSearchChange}
            onClose={() => setSearchMode(false)}
            category={filterCategory}
            onCategoryChange={handleFilterCategoryChange}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
          />
        </Animated.View>
      ) : null}

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
              onListInteraction={dismissSearch}
            />
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}

export function SavedItemsScreen({ onBack }: SavedItemsScreenProps) {
  return (
    <SavedItemSheetProvider>
      <SavedItemsContent onBack={onBack} />
    </SavedItemSheetProvider>
  );
}
