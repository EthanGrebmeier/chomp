import { PlusIcon, SearchIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDebounceCallback } from 'usehooks-ts';

import { Heading } from '@/components/text/heading';
import { TextInput } from '@/components/text-input';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';
import { CategoriesList } from '@/features/categories/components/categories-list';
import {
  CategorySheetProvider,
  useCategorySheet,
} from '@/features/categories/components/create-category-sheet';
import { useCategories } from '@/features/categories/instant/use-categories';
import { SavedItemsListSkeleton } from '@/features/saved-items/components/saved-items-list-skeleton';
import { builtInCategoryOptions } from '@/features/shared/category/categories';

const SEARCH_QUERY_DEBOUNCE_MS = 300;

const CategoriesContent = () => {
  const { data: categories, isLoading } = useCategories();
  const { present } = useCategorySheet();
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

  const handleSearchChange = useCallback(
    (text: string) => {
      handleSearchInputChange(text);
      debouncedSetSearchQuery(text);
    },
    [debouncedSetSearchQuery, handleSearchInputChange]
  );

  const visibleCategoryCount = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    if (!normalizedSearchQuery) {
      return builtInCategoryOptions.length + categories.length;
    }

    const builtInMatches = builtInCategoryOptions.filter(category =>
      category.label.toLowerCase().includes(normalizedSearchQuery)
    ).length;
    const customMatches = categories.filter(category =>
      category.name.toLowerCase().includes(normalizedSearchQuery)
    ).length;

    return builtInMatches + customMatches;
  }, [categories, searchQuery]);

  return (
    <View className="flex-1 bg-background pt-6">
      <View className="flex-row items-center gap-3 px-4">
        <BackButton href="/settings" />
        <Heading>My Categories</Heading>
      </View>

      <View className="mt-4 px-4">
        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-0 z-10 h-full justify-center">
            <Icon as={SearchIcon} size={18} className="text-muted-foreground" />
          </View>
          <TextInput
            key={searchInputKey}
            className="pl-10"
            placeholder="Search categories..."
            defaultValue={searchDefaultValue}
            onChangeText={handleSearchChange}
            autoCorrect={false}
          />
        </View>
      </View>

      <View className="mt-3 px-4">
        <Text variant="caption" tabularNumbers>
          {visibleCategoryCount} categor
          {visibleCategoryCount === 1 ? 'y' : 'ies'}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
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
            <CategoriesList
              categories={categories}
              searchQuery={searchQuery}
              onEditCategory={present}
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
};

export default function CategoriesPage() {
  return (
    <CategorySheetProvider>
      <CategoriesContent />
    </CategorySheetProvider>
  );
}
