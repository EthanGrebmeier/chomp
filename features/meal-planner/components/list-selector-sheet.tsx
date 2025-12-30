import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef } from 'react';
import { Pressable, ScrollView } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { useGroceryLists } from '../../grocery-lists/instant/useGroceryLists';

export interface ListSelectorSheetProps {
  onListSelect: (listId: string) => void;
  isLoading?: boolean;
}

export const ListSelectorSheet = forwardRef<TrueSheet, ListSelectorSheetProps>(
  ({ onListSelect, isLoading = false }, ref) => {
    const { data: lists } = useGroceryLists();

    return (
      <BottomSheet
        name="add-meals-to-list-sheet"
        ref={ref}
        detents={['auto']}
      >
        <BottomSheet.Header
          className="px-4"
          title="Add Meal Plan Items to List"
        />
        <ScrollView className="max-h-80 px-4 pb-4">
          {lists?.grocery_lists.map(list => (
            <Pressable
              key={list.id}
              onPress={() => onListSelect(list.id)}
              disabled={isLoading}
              className={cn(
                'mb-2 rounded-xl px-4 py-3',
                isLoading ? 'bg-muted/50' : 'bg-muted active:bg-muted/80'
              )}
            >
              <Text className="text-lg">{list.name}</Text>
              <Text className="text-sm text-muted-foreground">
                {list.grocery_items?.filter(i => !i.isDeleted).length || 0}{' '}
                items
              </Text>
            </Pressable>
          ))}
          {(!lists?.grocery_lists || lists.grocery_lists.length === 0) && (
            <Text className="text-center text-muted-foreground">
              No lists available
            </Text>
          )}
        </ScrollView>
      </BottomSheet>
    );
  }
);

ListSelectorSheet.displayName = 'ListSelectorSheet';

