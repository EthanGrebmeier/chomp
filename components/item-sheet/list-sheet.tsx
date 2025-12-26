import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  CheckIcon,
  ChevronDownIcon,
  ListIcon,
  NotebookIcon,
} from 'lucide-react-native';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { useGroceryLists } from '../../features/grocery-lists/instant/useGroceryLists';
import { useTrackListAccess } from '../../features/grocery-lists/instant/useTrackListAccess';
import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { BottomSheet } from '../bottom-sheet';
import { BackButton } from '../ui/back-button';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';

type ListOptionProps = {
  name: string;
  isSelected: boolean;
  onPress: () => void;
};

const ListOption = ({ name, isSelected, onPress }: ListOptionProps) => (
  <HapticPressable onPress={onPress} hapticType="selection">
    <View
      className={cn(
        'flex-row items-center gap-3 rounded-xl px-4 py-3',
        isSelected ? 'bg-primary/10' : 'active:bg-muted'
      )}
    >
      <View className="size-10 items-center justify-center rounded-full bg-muted">
        <Icon as={ListIcon} size={20} className="text-muted-foreground" />
      </View>
      <Text
        className={cn(
          'flex-1 text-lg',
          isSelected && 'font-semibold text-primary'
        )}
      >
        {name}
      </Text>
      {isSelected && <Icon as={CheckIcon} size={20} className="text-primary" />}
    </View>
  </HapticPressable>
);

type ListSheetProps = {
  listId: string;
  onSelect: (listId: string) => void;
};

export const ListSheet = ({ listId, onSelect }: ListSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const { data } = useGroceryLists();
  const trackListAccess = useTrackListAccess();

  const groceryLists = data?.grocery_lists ?? [];
  const selectedList = groceryLists.find(list => list.id === listId);

  const openSheet = () => {
    sheetRef.current?.present();
  };

  const handleSelect = (id: string) => {
    trackListAccess(id);
    onSelect(id);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <WithLayoutTransition>
        <HapticPressable onPress={openSheet} hapticType="light">
          <View className="flex-row items-center gap-2">
            <Icon as={NotebookIcon} className="text-foreground" size={16} />
            <Text className="font-semibold text-foreground">
              {selectedList?.name ?? 'Select List'}
            </Text>
            <Icon as={ChevronDownIcon} className="text-foreground" size={16} />
          </View>
        </HapticPressable>
      </WithLayoutTransition>

      <BottomSheet ref={sheetRef} name="list-sheet">
        <BottomSheet.SheetView>
          <View className="flex-row items-center gap-2 pb-2">
            <BackButton onPress={() => sheetRef.current?.dismiss()} />
            <BottomSheet.Header title="Select List" />
          </View>
          <ScrollView
            className="max-h-96 min-h-48"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {groceryLists.length === 0 ? (
              <Text className="py-4 text-center text-muted-foreground">
                No lists available
              </Text>
            ) : (
              groceryLists.map(list => (
                <ListOption
                  key={list.id}
                  name={list.name}
                  isSelected={listId === list.id}
                  onPress={() => handleSelect(list.id)}
                />
              ))
            )}
          </ScrollView>
        </BottomSheet.SheetView>
      </BottomSheet>
    </>
  );
};
