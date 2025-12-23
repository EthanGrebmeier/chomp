import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { createContext, useContext, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { createStore } from '../instant/create-store';
import { updateStore } from '../instant/update-store';
import { Store } from '../types';

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
  name: string;
  setName: (name: string) => void;
  reset: () => void;
  onSubmit: () => void;
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
  const { reset, nameInputRef, name, setName, onSubmit, sheetRef } =
    useStoreSheetInternal();

  return (
    <BottomSheet
      viewClassName="pb-4"
      name="store-sheet"
      ref={sheetRef}
      onStartClose={reset}
      onOpen={() => {
        nameInputRef.current?.focus();
      }}
    >
      <BottomSheet.SheetView>
        <View className="flex-row items-center gap-2 pb-2">
          <BackButton onPress={() => sheetRef.current?.dismiss()} />
          <BottomSheet.Header
            title={submitLabel === 'Update' ? 'Edit Store' : 'New Store'}
          />
        </View>
        <View className="mt-4">
          <Text className="mb-2 text-sm font-medium text-muted-foreground">
            Store Name
          </Text>
          <TextInput
            ref={nameInputRef}
            value={name}
            onChangeText={setName}
            placeholder="Enter store name..."
            placeholderTextColor="#9ca3af"
            className="rounded-xl border border-border bg-input px-4 py-3 text-base text-foreground"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        </View>
        <View className="mt-6">
          <Button variant="default" onPress={onSubmit} disabled={!name.trim()}>
            <Text>{submitLabel}</Text>
          </Button>
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

type StoreSheetProviderProps = {
  children: React.ReactNode;
};

export const StoreSheetProvider = ({
  children,
}: StoreSheetProviderProps) => {
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [name, setName] = useState('');
  const nameInputRef = useRef<TextInput>(null);
  const sheetRef = useRef<TrueSheet>(null);

  const isEditing = !!editingStore;

  const reset = () => {
    setName('');
    setEditingStore(null);
  };

  const onSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Store name cannot be empty');
      return;
    }

    try {
      if (isEditing && editingStore) {
        await updateStore({
          storeId: editingStore.id,
          updates: { name: trimmedName },
        });
        toast.success(`Store "${trimmedName}" updated`);
      } else {
        await createStore({ name: trimmedName });
        toast.success(`Store "${trimmedName}" created`);
      }
      sheetRef.current?.dismiss();
      reset();
    } catch (error) {
      toast.error(
        isEditing ? 'Failed to update store' : 'Failed to create store'
      );
    }
  };

  const present = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setName(store.name);
    } else {
      setEditingStore(null);
      setName('');
    }
    sheetRef.current?.present();
  };

  return (
    <StoreSheetContext.Provider value={{ present }}>
      <StoreSheetInternalContext.Provider
        value={{
          sheetRef,
          nameInputRef,
          name,
          setName,
          reset,
          onSubmit,
        }}
      >
        <StoreSheetContents submitLabel={isEditing ? 'Update' : 'Create'} />
        {children}
      </StoreSheetInternalContext.Provider>
    </StoreSheetContext.Provider>
  );
};

