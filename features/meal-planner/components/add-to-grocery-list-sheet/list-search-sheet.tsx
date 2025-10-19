import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '../../../../components/bottom-sheet';
import { TextInput } from '../../../../components/text-input';
import { Text } from '../../../../components/ui/text';
import { GroceryListItemCard } from '../../../grocery-list/components/grocery-list-item-card';
import { useGroceryLists } from '../../../grocery-list/hooks/useGroceryLists';
import { GroceryListWithItems } from '../../../grocery-list/types';

type GroceryListSearchSheetProps = {
  onSelectList: (list: GroceryListWithItems) => void;
  onCancel: () => void;
  title?: string;
};

export type GroceryListSearchSheetRef = {
  open: () => void;
  close: () => void;
};

export const GroceryListSearchSheet = forwardRef<
  GroceryListSearchSheetRef,
  GroceryListSearchSheetProps
>(({ onSelectList, onCancel, title = 'Select Grocery List' }, ref) => {
  const bottomSheetRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { top } = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const { data: groceryLists, isLoading: isLoadingLists } = useGroceryLists();

  useImperativeHandle(ref, () => ({
    open: () => {
      bottomSheetRef.current?.present();
    },
    close: () => {
      bottomSheetRef.current?.dismiss();
      setSearchQuery('');
    },
  }));

  // Filter lists based on search query
  const filteredLists =
    groceryLists?.filter(list =>
      list.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const handleSelectList = (list: GroceryListWithItems) => {
    onSelectList(list);
    bottomSheetRef.current?.dismiss();
    setSearchQuery('');
  };

  const renderListItem = ({ item }: { item: GroceryListWithItems }) => (
    <GroceryListItemCard item={item} onPress={handleSelectList} />
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      onStartClose={() => {
        setSearchQuery('');
      }}
      ignoreSafeArea
      snapPoints={['50%']}
    >
      <View style={{ height: height - top - 100 }}>
        <BottomSheet.Header
          title={title}
          button={
            <Pressable
              onPress={() => {
                bottomSheetRef.current?.dismiss();
                onCancel?.();
              }}
            >
              <Text> Cancel </Text>
            </Pressable>
          }
        />

        <View className="mt-6 flex-1">
          {/* Search Input */}
          <View className="mb-4">
            <TextInput
              placeholder="Search grocery lists..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          {/* Results */}
          {isLoadingLists ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">Loading lists...</Text>
            </View>
          ) : filteredLists.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-muted-foreground">
                {searchQuery
                  ? 'No lists found matching your search'
                  : 'No grocery lists found'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredLists}
              keyExtractor={item => item.id}
              renderItem={renderListItem}
              showsVerticalScrollIndicator={false}
              className="flex-1"
              contentContainerClassName="pb-safe"
            />
          )}
        </View>
      </View>
    </BottomSheet>
  );
});
