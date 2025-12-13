import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { PlusIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { addGroceryListItem } from '../../../features/grocery-list/instant/add-grocery-list-item';
import { BaseGroceryItem } from '../../../features/grocery-list/types';
import { NATIVE_TABS_OFFSET } from '../../../features/shared/consts';
import { BottomSheet } from '../../bottom-sheet';
import { Button } from '../../ui/button';
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
      <Button
        size="iconLg"
        style={{ bottom: NATIVE_TABS_OFFSET }}
        onPress={openSheet}
        className="absolute right-4 z-10"
      >
        <Icon
          as={PlusIcon}
          size={28}
          strokeWidth={3}
          className="text-primary-foreground"
        />
      </Button>
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
  }) => {
    addGroceryListItem({
      listId,
      item,
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
