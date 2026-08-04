import { PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Heading } from '@/components/text/heading';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SavedItemsListSkeleton } from '@/features/saved-items/components/saved-items-list-skeleton';
import { useStores } from '@/features/stores/instant/use-stores';
import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

import { StoreSheetProvider, useStoreSheet } from './create-store-sheet';
import { StoresList } from './stores-list';

const SEARCH_QUERY_DEBOUNCE_MS = 300;

type StoresScreenProps = {
  onBack?: () => void;
};

function StoresContent({ onBack }: StoresScreenProps) {
  const { data: stores, isLoading } = useStores();
  const { present } = useStoreSheet();
  const { status } = useInstantAuthState();
  const canCreateStores = status === 'signed-in';
  const isGuest = status === 'guest';

  return (
    <View className="flex-1 bg-background pt-6">
      <View className="flex-row items-center gap-3 px-4">
        <BackButton onPress={onBack} href="/settings" />
        <View className="flex-1">
          <Heading>My Stores</Heading>
        </View>
        {canCreateStores ? (
          <Button
            size="icon"
            accessibilityLabel="Add store"
            onPress={() => present()}
          >
            <Icon
              as={PlusIcon}
              size={24}
              strokeWidth={3}
              className="text-primary-foreground"
            />
          </Button>
        ) : null}
      </View>

      <View className={isGuest ? 'mt-4 flex-1' : 'mt-2 flex-1'}>
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
            <StoresList stores={stores} onEditStore={present} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

export function StoresScreen({ onBack }: StoresScreenProps) {
  return (
    <StoreSheetProvider>
      <StoresContent onBack={onBack} />
    </StoreSheetProvider>
  );
}
