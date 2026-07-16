import { MapPinIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from './ui/icon';
import { Text } from './ui/text';

type StoreTagProps = {
  name: string;
};

export const StoreTag = ({ name }: StoreTagProps) => {
  if (!name) {
    return null;
  }

  return (
    <View className="flex-row items-center gap-0.5 ">
      <Icon
        as={MapPinIcon}
        size={10}
        strokeWidth={2.5}
        className="text-muted-foreground"
      />
      <Text variant="caption">{name}</Text>
    </View>
  );
};
