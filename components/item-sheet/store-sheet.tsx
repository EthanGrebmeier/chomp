import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { PlusIcon, StoreIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { toast } from 'sonner-native';

import { createStore } from '../../features/stores/instant/create-store';
import { useStores } from '../../features/stores/instant/use-stores';
import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { BottomSheet } from '../bottom-sheet';
import { BackButton } from '../ui/back-button';
import { Button } from '../ui/button';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Pill } from '../ui/pill';
import { Text } from '../ui/text';

type StoreOptionProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

const StoreOption = ({ label, isSelected, onPress }: StoreOptionProps) => (
  <HapticPressable onPress={onPress} hapticType="selection">
    <View
      className={cn(
        'flex-row items-center gap-3 rounded-xl px-2 py-3',
        isSelected && 'bg-muted'
      )}
    >
      <View className="size-10 items-center justify-center rounded-full bg-muted">
        <Icon as={StoreIcon} size={20} className="text-muted-foreground" />
      </View>
      <Text
        className={cn(
          'flex-1 text-base font-medium',
          isSelected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </Text>
    </View>
  </HapticPressable>
);

type StoreSheetProps = {
  storeId?: string;
  onSelect: (storeId?: string) => void;
};

export const StoreSheet = ({ storeId, onSelect }: StoreSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const createStoreSheetRef = useRef<TrueSheet>(null);
  const { data: stores, isLoading } = useStores();
  const [newStoreName, setNewStoreName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedStore, setNewlyCreatedStore] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Find selected store - check newly created first, then query results
  const selectedStore =
    newlyCreatedStore?.id === storeId
      ? newlyCreatedStore
      : stores.find(store => store.id === storeId);

  const openSheet = () => {
    sheetRef.current?.present();
  };

  const handleSelect = (id?: string) => {
    onSelect(id);
    sheetRef.current?.dismiss();
  };

  const handleOpenCreateStore = () => {
    createStoreSheetRef.current?.present();
  };

  const handleCreateStore = async () => {
    const trimmedName = newStoreName.trim();
    if (!trimmedName) {
      toast.error('Store name cannot be empty');
      return;
    }

    setIsCreating(true);
    try {
      const { id: newStoreId } = await createStore({ name: trimmedName });
      // Store the newly created store temporarily for immediate display
      setNewlyCreatedStore({ id: newStoreId, name: trimmedName });
      setNewStoreName('');
      // Select the new store
      onSelect(newStoreId);
      // Clear the temporary store after a short delay (query should update by then)
      setTimeout(() => {
        setNewlyCreatedStore(null);
      }, 1000);
      toast.success(`Store "${trimmedName}" created`);
      createStoreSheetRef.current?.dismiss();
      sheetRef.current?.dismiss();
    } catch (error) {
      toast.error('Failed to create store');
    } finally {
      setIsCreating(false);
    }
  };

  const canCreate = newStoreName.trim().length > 0 && !isCreating;

  return (
    <>
      <WithLayoutTransition>
        <HapticPressable onPress={openSheet} hapticType="light">
          <Pill
            icon={
              <Icon
                className={
                  selectedStore ? 'text-foreground' : 'text-muted-foreground'
                }
                as={StoreIcon}
                size={16}
              />
            }
            textClassName={cn(
              'font-semibold',
              selectedStore ? 'text-foreground' : 'text-muted-foreground'
            )}
            closeIconClassName={selectedStore ? 'text-foreground' : undefined}
            hasValue={!!selectedStore}
            onClear={() => onSelect(undefined)}
          >
            {selectedStore ? selectedStore.name : 'Store'}
          </Pill>
        </HapticPressable>
      </WithLayoutTransition>

      <BottomSheet ref={sheetRef} name="store-sheet">
        <BottomSheet.SheetView>
          <View className="flex-row items-center gap-2 pb-2">
            <BackButton onPress={() => sheetRef.current?.dismiss()} />
            <BottomSheet.Header title="Store" />
            <Button
              onPress={handleOpenCreateStore}
              size="icon"
              variant="ghost"
              className="ml-auto"
            >
              <Icon as={PlusIcon} size={24} className="text-primary" />
            </Button>
          </View>

          <ScrollView
            className="max-h-96"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <StoreOption
              label="None"
              isSelected={!storeId}
              onPress={() => handleSelect(undefined)}
            />

            {isLoading ? (
              <View className="py-4">
                <Text className="text-center text-muted-foreground">
                  Loading stores...
                </Text>
              </View>
            ) : (
              stores.map(store => (
                <StoreOption
                  key={store.id}
                  label={store.name}
                  isSelected={store.id === storeId}
                  onPress={() => handleSelect(store.id)}
                />
              ))
            )}
          </ScrollView>
        </BottomSheet.SheetView>
      </BottomSheet>

      {/* Create Store Sheet */}
      <BottomSheet ref={createStoreSheetRef} name="create-store-sheet">
        <BottomSheet.SheetView>
          <View className="flex-row items-center gap-2 pb-2">
            <BackButton
              onPress={() => createStoreSheetRef.current?.dismiss()}
            />
            <BottomSheet.Header title="New Store" />
          </View>
          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-muted-foreground">
              Store Name
            </Text>
            <TextInput
              value={newStoreName}
              onChangeText={setNewStoreName}
              placeholder="Enter store name..."
              placeholderTextColor="#9ca3af"
              className="rounded-xl border border-border bg-input px-4 py-3 text-base text-foreground"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleCreateStore}
              editable={!isCreating}
            />
          </View>
          <View className="mt-6">
            <Button
              variant="default"
              onPress={handleCreateStore}
              disabled={!canCreate}
            >
              <Text>Create</Text>
            </Button>
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
    </>
  );
};
