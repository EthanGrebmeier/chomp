import { ReactNode } from 'react';
import { View } from 'react-native';

import { Heading } from '../../../components/text/heading';
import { BackButton } from '../../../components/ui/back-button';

type GroceryListHeaderProps = {
  listName?: string;
  onBackPress: () => void;
  actions?: ReactNode;
};

export const GroceryListHeader = ({
  listName,
  onBackPress,
  actions,
}: GroceryListHeaderProps) => {
  return (
    <View className="px-4">
      <View className="h-11 flex-row items-center">
        <BackButton onPress={onBackPress} />
        <View className="min-w-0 flex-1 px-2">
          <Heading numberOfLines={1}>{listName ?? 'Grocery List'}</Heading>
        </View>
        {actions ? <View>{actions}</View> : null}
      </View>
    </View>
  );
};
