import { UsersIcon } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';

import { useGroceryLists } from '../instant/useGroceryLists';

type GroceryList = NonNullable<
  ReturnType<typeof useGroceryLists>['data']
>['grocery_lists'][number];

type GroceryListPickerProps = {
  lists: GroceryList[];
  onSelectList: (listId: string) => void;
  disabled?: boolean;
};

export const GroceryListPicker = ({
  lists,
  onSelectList,
  disabled,
}: GroceryListPickerProps) => {
  return (
    <ScrollView className="max-h-80 px-4 pb-4">
      {lists.map(list => {
        const isShared = (list.shares?.length ?? 0) > 1;
        return (
          <Pressable
            key={list.id}
            onPress={() => onSelectList(list.id)}
            disabled={disabled}
            className={cn(
              'mb-2 rounded-xl px-4 py-3',
              disabled ? 'bg-muted/50' : 'bg-muted active:bg-muted/80'
            )}
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">{list.name}</Text>
              {isShared && (
                <Icon
                  as={UsersIcon}
                  size={16}
                  className="text-muted-foreground"
                />
              )}
            </View>
            <Text className="text-sm text-muted-foreground">
              {list.grocery_items?.filter(i => !i.isDeleted && !i.isChecked)
                .length || 0}{' '}
              items
            </Text>
          </Pressable>
        );
      })}
      {lists.length === 0 && (
        <Text className="text-center text-muted-foreground">
          No lists available
        </Text>
      )}
    </ScrollView>
  );
};
