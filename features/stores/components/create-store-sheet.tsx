import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { createContext, useContext, useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Button } from '../../../components/ui/button';
import { DeleteButton } from '../../../components/ui/delete-button';
import { Text } from '../../../components/ui/text';
import { useUncontrolledTextInput } from '../../../components/use-uncontrolled-text-input';
import { createStore } from '../instant/create-store';
import { deleteStore } from '../instant/delete-store';
import { updateStore } from '../instant/update-store';
import { Store } from '../types';

import { DefaultStoreToggle } from './default-store-toggle';

type StoreSheetContextType = {
  present: (store?: Store) => void;
};

const StoreSheetContext = createContext<StoreSheetContextType | null>(null);

export const useStoreSheet = () => {
  const context = useContext(StoreSheetContext);
  if (!context) {
    throw new Error('useStoreSheet must be used within a StoreSheetProvider');
  }
  return context;
};

// Internal context for sharing the sheet ref and state
type StoreSheetInternalContextType = {
  sheetRef: React.RefObject<TrueSheet | null>;
  nameInputRef: React.RefObject<TextInput | null>;
  nameInputKey: number;
  nameDefaultValue: string;
  isDefault: boolean;
  canSubmit: boolean;
  onNameChange: (name: string) => void;
  onDefaultChange: () => void;
  reset: () => void;
  onSubmit: () => void;
  /** Present only when editing an existing store. */
  onDelete?: () => void;
};

const StoreSheetInternalContext =
  createContext<StoreSheetInternalContextType | null>(null);

const useStoreSheetInternal = () => {
  const context = useContext(StoreSheetInternalContext);
  if (!context) {
    throw new Error(
      'useStoreSheetInternal must be used within a StoreSheetProvider'
    );
  }
  return context;
};

const StoreSheetContents = ({ submitLabel }: { submitLabel: string }) => {
  const {
    reset,
    nameInputRef,
    nameInputKey,
    nameDefaultValue,
    isDefault,
    canSubmit,
    onNameChange,
    onDefaultChange,
    onSubmit,
    onDelete,
    sheetRef,
  } = useStoreSheetInternal();

  return (
    <BottomSheet
      name="store-sheet"
      ref={sheetRef}
      onStartClose={reset}
      onOpen={() => {
        nameInputRef.current?.focus();
      }}
      footer={
        <View className="px-10 pb-4">
          <Button variant="default" onPress={onSubmit} disabled={!canSubmit}>
            <Text>{submitLabel}</Text>
          </Button>
        </View>
      }
    >
      <BottomSheet.SheetView className="pb-safe">
        <BottomSheet.Header
          title={submitLabel === 'Update' ? 'Rename store' : 'Add a store'}
          button={
            onDelete ? (
              <DeleteButton
                accessibilityLabel="Delete store"
                onPress={onDelete}
              />
            ) : undefined
          }
        />
        <View>
          <Text className="mb-2 text-sm font-medium text-muted-foreground">
            Store Name
          </Text>
          <BottomSheet.TextInput
            key={nameInputKey}
            defaultValue={nameDefaultValue}
            onChangeText={onNameChange}
            placeholder="My Store"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        </View>
        <DefaultStoreToggle
          checked={isDefault}
          className="mt-4"
          onToggle={onDefaultChange}
        />
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

type StoreSheetProviderProps = {
  children: React.ReactNode;
};

export const StoreSheetProvider = ({ children }: StoreSheetProviderProps) => {
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const nameInput = useUncontrolledTextInput();
  const [isDefault, setIsDefault] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const nameInputRef = useRef<TextInput>(null);
  const sheetRef = useRef<TrueSheet>(null);

  const isEditing = !!editingStore;

  const reset = () => {
    nameInput.reset();
    setIsDefault(false);
    setCanSubmit(false);
    setEditingStore(null);
  };

  const onSubmit = async () => {
    const trimmedName = nameInput.getValue().trim();
    if (!trimmedName) {
      toast.error('Store name cannot be empty');
      return;
    }

    try {
      if (isEditing && editingStore) {
        await updateStore({
          storeId: editingStore.id,
          updates: { name: trimmedName, isDefault },
        });
      } else {
        await createStore({ name: trimmedName, isDefault });
      }
      sheetRef.current?.dismiss();
      reset();
    } catch {
      toast.error(
        isEditing ? 'Failed to update store' : 'Failed to create store'
      );
    }
  };

  const deleteEditingStore = async (store: Store) => {
    try {
      await deleteStore({ storeId: store.id });
      sheetRef.current?.dismiss();
      reset();
    } catch {
      toast.error('Failed to delete store');
    }
  };

  const onDelete = editingStore
    ? () => {
        Alert.alert(
          'Delete Store',
          `Are you sure you want to delete "${editingStore.name}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => void deleteEditingStore(editingStore),
            },
          ]
        );
      }
    : undefined;

  const onNameChange = (name: string) => {
    nameInput.handleChangeText(name);
    setCanSubmit(name.trim().length > 0);
  };

  const present = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      nameInput.reset(store.name);
      setIsDefault(!!store.isDefault);
      setCanSubmit(store.name.trim().length > 0);
    } else {
      setEditingStore(null);
      nameInput.reset();
      setIsDefault(false);
      setCanSubmit(false);
    }
    sheetRef.current?.present();
  };

  return (
    <StoreSheetContext.Provider value={{ present }}>
      <StoreSheetInternalContext.Provider
        value={{
          sheetRef,
          nameInputRef,
          nameInputKey: nameInput.inputKey,
          nameDefaultValue: nameInput.defaultValue,
          isDefault,
          canSubmit,
          onNameChange,
          onDefaultChange: () => setIsDefault(current => !current),
          reset,
          onSubmit,
          onDelete,
        }}
      >
        <StoreSheetContents submitLabel={isEditing ? 'Update' : 'Create'} />
        {children}
      </StoreSheetInternalContext.Provider>
    </StoreSheetContext.Provider>
  );
};
