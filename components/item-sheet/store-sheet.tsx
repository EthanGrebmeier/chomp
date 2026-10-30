import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { PlusIcon } from 'lucide-react-native';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { SheetFooter } from '@/components/sheet-content';
import { BottomActionButton } from '@/components/ui/bottom-action-button';

import { DefaultStoreToggle } from '../../features/stores/components/default-store-toggle';
import { createStore } from '../../features/stores/instant/create-store';
import { useStores } from '../../features/stores/instant/use-stores';
import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { BottomSheet } from '../bottom-sheet';
import { BackButton } from '../ui/back-button';
import { ConfirmButton } from '../ui/confirm-button';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Pill } from '../ui/pill';
import { Text } from '../ui/text';
import { useUncontrolledTextInput } from '../use-uncontrolled-text-input';

import { OptionDropdown } from './option-dropdown';
import { usePresentOnOpenRequest } from './present-on-open-request';

type StoreOptionProps = {
  label: string;
  isDefault?: boolean;
  isSelected: boolean;
  onPress: () => void;
};

const StoreOption = ({
  label,
  isDefault = false,
  isSelected,
  onPress,
}: StoreOptionProps) => (
  <HapticPressable onPress={onPress} hapticType="selection">
    <View
      className={cn(
        'relative flex-row items-center justify-center rounded-xl px-2 py-3',
        isSelected && 'bg-muted'
      )}
    >
      <Text
        className={cn(
          'text-center text-base font-medium',
          isSelected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </Text>
      {isDefault ? (
        <View className="absolute bottom-0 right-2 top-0 justify-center">
          <View className="rounded-full bg-primary/10 px-2 py-0.5">
            <Text className="text-xs font-semibold text-primary">Default</Text>
          </View>
        </View>
      ) : null}
    </View>
  </HapticPressable>
);

type StoreSheetProps = {
  storeId?: string | null;
  storeName?: string;
  onSelect: (storeId?: string, storeName?: string) => void;
  hideTrigger?: boolean;
  showBackButton?: boolean;
  sheetName?: string;
  openRequestId?: number;
  disabled?: boolean;
  selectionMode?: 'sheet' | 'dropdown';
};

export type StoreSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const StoreSheet = forwardRef<StoreSheetRef, StoreSheetProps>(
  (
    {
      storeId,
      storeName,
      onSelect,
      hideTrigger = false,
      showBackButton = true,
      sheetName = 'store-sheet',
      openRequestId,
      disabled = false,
      selectionMode = 'dropdown',
    },
    ref
  ) => {
    const sheetRef = useRef<TrueSheet>(null);
    const createStoreSheetRef = useRef<TrueSheet>(null);
    const { data: stores, isLoading } = useStores();
    const sortedStores = [...stores].sort(
      (left, right) =>
        Number(!!right.isDefault) - Number(!!left.isDefault) ||
        left.name.toLowerCase().localeCompare(right.name.toLowerCase())
    );
    const [localStoreId, setLocalStoreId] = useState<string | undefined | null>(
      storeId
    );
    const newStoreNameInput = useUncontrolledTextInput();
    const [newStoreIsDefault, setNewStoreIsDefault] = useState(false);
    const [canCreateStore, setCanCreateStore] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newlyCreatedStore, setNewlyCreatedStore] = useState<{
      id: string;
      name: string;
      isDefault?: boolean;
    } | null>(null);

    // Find selected store - check newly created first, then query results
    const selectedStore =
      newlyCreatedStore?.id === (storeId ?? undefined)
        ? newlyCreatedStore
        : stores.find(store => store.id === (storeId ?? undefined));
    const selectedStoreName =
      selectedStore?.name ?? (storeId ? storeName : undefined);
    const hasSelectedStore = Boolean(selectedStoreName);
    const hasMissingSelectedStore =
      Boolean(localStoreId) && !stores.some(store => store.id === localStoreId);

    const openSheet = useCallback(() => {
      if (disabled) return;
      setLocalStoreId(storeId);
      sheetRef.current?.present();
    }, [disabled, storeId]);

    usePresentOnOpenRequest(openRequestId, openSheet);

    useImperativeHandle(ref, () => ({
      present: openSheet,
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleConfirm = () => {
      if (localStoreId === null) {
        return;
      }
      const nextStoreName =
        localStoreId === undefined
          ? undefined
          : (stores.find(store => store.id === localStoreId)?.name ??
            selectedStoreName);
      onSelect(localStoreId, nextStoreName);
      sheetRef.current?.dismiss();
    };

    const handleOpenCreateStore = () => {
      setNewStoreIsDefault(false);
      createStoreSheetRef.current?.present();
    };

    const handleCreateStore = async () => {
      const trimmedName = newStoreNameInput.getValue().trim();
      if (!trimmedName) {
        toast.error('Store name cannot be empty');
        return;
      }

      setIsCreating(true);
      try {
        const { id: newStoreId } = await createStore({
          name: trimmedName,
          isDefault: newStoreIsDefault,
        });
        setNewlyCreatedStore({
          id: newStoreId,
          name: trimmedName,
          isDefault: newStoreIsDefault,
        });
        newStoreNameInput.reset();
        setNewStoreIsDefault(false);
        setCanCreateStore(false);
        setLocalStoreId(newStoreId);
        if (selectionMode === 'dropdown') onSelect(newStoreId, trimmedName);
        setTimeout(() => {
          setNewlyCreatedStore(null);
        }, 1000);
        createStoreSheetRef.current?.dismiss();
      } catch {
        toast.error('Failed to create store');
      } finally {
        setIsCreating(false);
      }
    };

    const handleNewStoreNameChange = (text: string) => {
      newStoreNameInput.handleChangeText(text);
      setCanCreateStore(text.trim().length > 0);
    };

    const canCreate = canCreateStore && !isCreating;

    const trigger = (
      <Pill
        className={cn(disabled && 'opacity-50')}
        textClassName={cn(
          'font-semibold',
          hasSelectedStore && !disabled
            ? 'text-foreground'
            : 'text-muted-foreground'
        )}
        hasValue={hasSelectedStore}
      >
        {selectedStoreName ?? 'Store'}
      </Pill>
    );
    const dropdownOptions = sortedStores.map(store => ({
      value: store.id,
      label: store.isDefault ? `${store.name} (Default)` : store.name,
    }));
    if (storeId && !stores.some(store => store.id === storeId)) {
      dropdownOptions.unshift({
        value: storeId,
        label: selectedStoreName ?? 'Current store',
      });
    }

    return (
      <>
        {!hideTrigger && (
          <WithLayoutTransition>
            {selectionMode === 'dropdown' ? (
              <OptionDropdown
                label="store"
                value={storeId}
                disabled={disabled}
                options={dropdownOptions}
                onSelect={value =>
                  onSelect(
                    value,
                    value
                      ? (stores.find(store => store.id === value)?.name ??
                          selectedStoreName)
                      : undefined
                  )
                }
                onCreate={handleOpenCreateStore}
              >
                {trigger}
              </OptionDropdown>
            ) : (
              <HapticPressable
                onPress={openSheet}
                hapticType="light"
                disabled={disabled}
              >
                {trigger}
              </HapticPressable>
            )}
          </WithLayoutTransition>
        )}

        {selectionMode === 'sheet' ? (
          <BottomSheet
            detents={[0.7]}
            scrollable
            ref={sheetRef}
            name={sheetName}
          >
            <BottomSheet.Header
              backAction={
                showBackButton ? (
                  <BackButton onPress={() => sheetRef.current?.dismiss()} />
                ) : undefined
              }
              title="Choose a store"
              primaryAction={
                <ConfirmButton
                  onPress={handleConfirm}
                  disabled={localStoreId === null}
                />
              }
            />

            <ScrollView
              className="max-h-96 px-8"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <HapticPressable
                onPress={handleOpenCreateStore}
                hapticType="light"
              >
                <View className="flex-row items-center justify-center gap-3 rounded-xl px-2 py-3">
                  <View className="size-4  items-center justify-center rounded-full bg-primary">
                    <Icon
                      className="text-primary-foreground"
                      as={PlusIcon}
                      strokeWidth={3}
                      size={12}
                    />
                  </View>
                  <Text className="text-base font-semibold text-primary">
                    Create new store
                  </Text>
                </View>
              </HapticPressable>

              <StoreOption
                label="None"
                isSelected={localStoreId === undefined}
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
                sortedStores.map(store => (
                  <StoreOption
                    key={store.id}
                    label={store.name}
                    isDefault={!!store.isDefault}
                    isSelected={store.id === localStoreId}
                    onPress={() => setLocalStoreId(store.id)}
                  />
                ))
              )}
            </ScrollView>
          </BottomSheet>
        ) : null}

        {/* Create Store Sheet */}
        <BottomSheet
          ref={createStoreSheetRef}
          name="create-store-sheet"
          detents={['auto']}
          footer={
            <SheetFooter>
              <BottomActionButton
                variant="default"
                onPress={handleCreateStore}
                disabled={!canCreate}
              >
                <Text>Create</Text>
              </BottomActionButton>
            </SheetFooter>
          }
        >
          <BottomSheet.SheetView>
            <BottomSheet.Header
              className="mb-0"
              title="Add a store"
              backAction={
                showBackButton ? (
                  <BackButton
                    onPress={() => createStoreSheetRef.current?.dismiss()}
                  />
                ) : undefined
              }
            />
            <View className="mt-4">
              <Text className="mb-2 text-sm font-medium text-muted-foreground">
                Store Name
              </Text>
              <BottomSheet.TextInput
                key={newStoreNameInput.inputKey}
                defaultValue={newStoreNameInput.defaultValue}
                onChangeText={handleNewStoreNameChange}
                placeholder="My Store"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleCreateStore}
                editable={!isCreating}
              />
            </View>
            <DefaultStoreToggle
              checked={newStoreIsDefault}
              className="mt-4"
              onToggle={() => setNewStoreIsDefault(current => !current)}
            />
          </BottomSheet.SheetView>
        </BottomSheet>
      </>
    );
  }
);

StoreSheet.displayName = 'StoreSheet';
