import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { PlusIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, View } from 'react-native';

import { BottomSheet } from '../../../../components/bottom-sheet';
import { Icon } from '../../../../components/ui/icon';
import { NATIVE_TABS_OFFSET } from '../../../shared/consts';

import BottomBar from './bottom-bar';
import { ItemInput } from './item-input';
import { MetaBar } from './meta-bar';
import { AddItemProvider, useAddItem } from './useAddItem';

const AddItemSheet = () => {
  const ref = useRef<TrueSheet>(null);
  const {
    itemInputRef: inputRef,
    notesInputValue,
    onChangeNotesText,
  } = useAddItem();

  const openSheet = () => {
    ref.current?.present();
    inputRef.current?.focus();
  };
  return (
    <>
      <Pressable
        className="absolute right-4 z-10"
        style={{ bottom: NATIVE_TABS_OFFSET }}
        onPress={openSheet}
      >
        <Icon as={PlusIcon} className="size-10" />
      </Pressable>
      <BottomSheet
        viewClassName="pb-4"
        ignoreSafeArea
        name="add-item-sheet"
        ref={ref}
      >
        <View>
          <ItemInput placeholder="Add Item" />
          <BottomSheet.BareTextInput
            value={notesInputValue}
            onChangeText={onChangeNotesText}
            placeholder="Notes"
            multiline
            style={{ textAlignVertical: 'top' }}
            className="min-h-60 text-start text-lg font-bold text-foreground"
          />
          <MetaBar />
          <BottomBar />
        </View>
      </BottomSheet>
    </>
  );
};

type AddItemProps = {
  groceryListId: string;
};

const AddItem = ({ groceryListId }: AddItemProps) => {
  return (
    <AddItemProvider groceryListId={groceryListId}>
      <AddItemSheet />
    </AddItemProvider>
  );
};

export default AddItem;
