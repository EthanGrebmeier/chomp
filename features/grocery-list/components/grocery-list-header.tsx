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
      <View className="h-11 flex-row items-center justify-between">
        <BackButton onPress={onBackPress} />
        {actions ? <View>{actions}</View> : null}
      </View>
      <View className="h-10 justify-center">
        <Heading>{listName ?? 'Grocery List'}</Heading>
      </View>
    </View>
  );
};
