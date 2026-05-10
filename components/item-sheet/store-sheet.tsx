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
import { ConfirmButton } from '../ui/confirm-button';
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
        'flex-row items-center justify-center gap-3 rounded-xl px-2 py-3',
        isSelected && 'bg-muted'
      )}
    >
      <Text
        className={cn(
          'text-base font-medium',
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
  storeName?: string;
  onSelect: (storeId?: string, storeName?: string) => void;
};

export const StoreSheet = ({
  storeId,
  storeName,
  onSelect,
}: StoreSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const createStoreSheetRef = useRef<TrueSheet>(null);
  const { data: stores, isLoading } = useStores();
  const [localStoreId, setLocalStoreId] = useState<string | undefined>(storeId);
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
  const selectedStoreName =
    selectedStore?.name ?? (storeId ? storeName : undefined);
  const hasSelectedStore = Boolean(selectedStoreName);
  const hasMissingSelectedStore =
    Boolean(localStoreId) && !stores.some(store => store.id === localStoreId);

  const openSheet = () => {
    setLocalStoreId(storeId);
    sheetRef.current?.present();
  };

  const handleConfirm = () => {
    const nextStoreName =
      localStoreId === undefined
        ? undefined
        : (stores.find(store => store.id === localStoreId)?.name ??
          selectedStoreName);
    onSelect(localStoreId, nextStoreName);
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
      setNewlyCreatedStore({ id: newStoreId, name: trimmedName });
      setNewStoreName('');
      setLocalStoreId(newStoreId);
      setTimeout(() => {
        setNewlyCreatedStore(null);
      }, 1000);
      toast.success(`Store "${trimmedName}" created`);
      createStoreSheetRef.current?.dismiss();
    } catch {
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
            className={cn(!localStoreId && 'border-dashed')}
            icon={
              <Icon
                className={
                  hasSelectedStore ? 'text-foreground' : 'text-muted-foreground'
                }
                as={StoreIcon}
                size={16}
              />
            }
            textClassName={cn(
              'font-semibold',
              hasSelectedStore ? 'text-foreground' : 'text-muted-foreground'
            )}
            closeIconClassName={
              hasSelectedStore ? 'text-foreground' : undefined
            }
            hasValue={hasSelectedStore}
            onClear={() => onSelect(undefined, undefined)}
          >
            {selectedStoreName ?? 'Store'}
          </Pill>
        </HapticPressable>
      </WithLayoutTransition>

      <BottomSheet detents={[0.7]} scrollable ref={sheetRef} name="store-sheet">
        <BottomSheet.Header
          className="mb-0 px-4"
          dismissButton={
            <BackButton onPress={() => sheetRef.current?.dismiss()} />
          }
          title="Store"
          button={<ConfirmButton onPress={handleConfirm} />}
        />

        <ScrollView
          className="max-h-96 px-2"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
        >
          <HapticPressable onPress={handleOpenCreateStore} hapticType="light">
            <View className="flex-row items-center justify-center gap-3 rounded-xl px-2 py-3">
              <View className="size-4  items-center justify-center rounded-full bg-primary">
                <Icon
                  className="text-primary-foreground"
                  as={PlusIcon}
                  strokeWidth={3}
                  size={12}
                />
              </View>
              <Text className=" text-base font-bold tracking-[-0.2] text-primary">
                Create new store
              </Text>
            </View>
          </HapticPressable>

          <StoreOption
            label="None"
            isSelected={!localStoreId}
            onPress={() => setLocalStoreId(undefined)}
          />

          {hasMissingSelectedStore && (
            <StoreOption
              label={selectedStoreName ?? 'Current store'}
              isSelected={true}
              onPress={() => setLocalStoreId(storeId)}
            />
          )}

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
                isSelected={store.id === localStoreId}
                onPress={() => setLocalStoreId(store.id)}
              />
            ))
          )}
        </ScrollView>
      </BottomSheet>

      {/* Create Store Sheet */}
      <BottomSheet
        ref={createStoreSheetRef}
        name="create-store-sheet"
        footer={
          <View className="px-10 pb-4">
            <Button
              variant="default"
              onPress={handleCreateStore}
              disabled={!canCreate}
            >
              <Text>Create</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.SheetView className="pb-safe">
          <BottomSheet.Header
            className="mb-0"
            title="New Store"
            dismissButton={
              <BackButton
                onPress={() => createStoreSheetRef.current?.dismiss()}
              />
            }
          />
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
        </BottomSheet.SheetView>
      </BottomSheet>
    </>
  );
};
