import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { PlusIcon, SearchIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { TextInput } from '@/components/text-input';
import { Heading } from '@/components/text/heading';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  SavedItemSheetProvider,
  useSavedItemSheet,
} from '@/features/saved-items/components/add-saved-item-sheet';
import { SavedItemsList } from '@/features/saved-items/components/saved-items-list';
import { useSavedItems } from '@/features/saved-items/instant/use-saved-items';

const SavedItemsContent = () => {
  const { data: savedItems, isLoading } = useSavedItems();
  const { present } = useSavedItemSheet();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return savedItems;
    }
    return savedItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [savedItems, searchQuery]);

  return (
    <View className="pt-safe flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4">
        <BackButton href="/(tabs)/settings" />
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

      {/* Item count */}
      <View className="mt-3 px-4">
        <Text className="text-sm text-muted-foreground">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </Text>
      </View>

      {/* List */}
      <View className="mt-2 flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Loading...</Text>
          </View>
        ) : (
          <SavedItemsList items={filteredItems} onEditItem={present} />
        )}
      </View>

      {/* Add button */}
      <View className="absolute bottom-6 right-6 z-20">
        <Button size="iconLg" onPress={() => present()}>
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
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in-email" />;
  }

  return (
    <SavedItemSheetProvider>
      <SavedItemsContent />
    </SavedItemSheetProvider>
  );
}
