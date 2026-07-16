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
import { SavedItemsListSkeleton } from '@/features/saved-items/components/saved-items-list-skeleton';
import {
  StoreSheetProvider,
  useStoreSheet,
} from '@/features/stores/components/create-store-sheet';
import { StoresList } from '@/features/stores/components/stores-list';
import { useStores } from '@/features/stores/instant/use-stores';

const SEARCH_QUERY_DEBOUNCE_MS = 300;

const StoresContent = () => {
  const { data: stores, isLoading } = useStores();
  const { present } = useStoreSheet();
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

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) {
      return stores;
    }
    return stores.filter(store =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stores, searchQuery]);

  return (
    <View className="flex-1 bg-background pt-6">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4">
        <BackButton href="/settings" />
        <Heading>My Stores</Heading>
      </View>

      {/* Search */}
      <View className="mt-4 px-4">
        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-0 z-10 h-full justify-center">
            <Icon as={SearchIcon} size={18} className="text-muted-foreground" />
          </View>
          <TextInput
            key={searchInputKey}
            className="pl-10"
            placeholder="Search stores..."
            defaultValue={searchDefaultValue}
            onChangeText={handleSearchChange}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Store count */}
      <View className="mt-3 px-4">
        <Text variant="caption" tabularNumbers>
          {filteredStores.length} store{filteredStores.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
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
            <StoresList stores={filteredStores} onEditStore={present} />
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

export default function StoresPage() {
  return (
    <StoreSheetProvider>
      <StoresContent />
    </StoreSheetProvider>
  );
}
