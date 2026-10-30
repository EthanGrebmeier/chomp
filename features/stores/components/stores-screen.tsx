import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { SHEET_TOP_STYLE } from '@/components/sheet-content';
import { SheetHeader } from '@/components/sheet-header';
import { AddButton } from '@/components/ui/add-button';
import { BackButton } from '@/components/ui/back-button';
import { SavedItemsListSkeleton } from '@/features/saved-items/components/saved-items-list-skeleton';
import { useStores } from '@/features/stores/instant/use-stores';
import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

import { StoreSheetProvider, useStoreSheet } from './create-store-sheet';
import { StoresList } from './stores-list';

type StoresScreenProps = {
  onBack?: () => void;
};

function StoresContent({ onBack }: StoresScreenProps) {
  const { data: stores, isLoading } = useStores();
  const { present } = useStoreSheet();
  const { status } = useInstantAuthState();
  const canCreateStores = status === 'signed-in';

  return (
    <View className="flex-1 bg-background" style={SHEET_TOP_STYLE}>
      <SheetHeader
        title="My Stores"
        subtitle={
          canCreateStores
            ? 'Tap a store to edit or delete it.'
            : 'Sign in to add or edit stores.'
        }
        backAction={<BackButton onPress={onBack} href="/settings" />}
        primaryAction={
          canCreateStores ? (
            <AddButton
              accessibilityLabel="Add store"
              onPress={() => present()}
            />
          ) : undefined
        }
      />

      <View className="flex-1">
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
