import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { PlusIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, View } from 'react-native';
import { toast } from 'sonner-native';

import { addGroceryListItem } from '../../../features/grocery-list/instant/add-grocery-list-item';
import { BaseGroceryItem } from '../../../features/grocery-list/types';
import { NATIVE_TABS_OFFSET } from '../../../features/shared/consts';
import { BottomSheet } from '../../bottom-sheet';
import { Icon } from '../../ui/icon';
import { ItemForm } from '../item-form';
import { MetaBar } from '../meta-bar';
import { ItemSheetProvider, useItemSheet } from '../use-item-sheet';

import AddItemBottomBar from './add-item-bottom-bar';

const AddItemSheet = () => {
  const ref = useRef<TrueSheet>(null);
  const { reset, itemInputRef } = useItemSheet();

  const openSheet = () => {
    ref.current?.present();
    itemInputRef.current?.focus();
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
        onStartClose={reset}
      >
        <View>
          <ItemForm />
          <MetaBar />
          <AddItemBottomBar />
        </View>
      </BottomSheet>
    </>
  );
};

type AddItemProps = {
  groceryListId: string;
};

const AddItem = ({ groceryListId }: AddItemProps) => {
  const onSubmit = ({
    item,
    listId,
  }: {
    item: BaseGroceryItem;
    listId: string;
    itemId: string | null;
  }) => {
    addGroceryListItem({
      listId,
      item: {
        ...item,
        isChecked: false,
      },
    });
    toast.success(`${item.name} added`);
  };

  return (
    <ItemSheetProvider groceryListId={groceryListId} onSubmit={onSubmit}>
      <AddItemSheet />
    </ItemSheetProvider>
  );
};

export default AddItem;
