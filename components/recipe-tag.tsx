import { BookOpenIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from './ui/icon';
import { Text } from './ui/text';

type RecipeTagProps = {
  name: string;
};

export const RecipeTag = ({ name }: RecipeTagProps) => {
  if (!name) {
    return null;
  }

  return (
    <View className="flex-row items-center gap-1">
      <View>
        <Icon
          as={BookOpenIcon}
          size={12}
          strokeWidth={3}
          className="text-muted-foreground"
        />
      </View>
      <Text className="text-xs font-semibold text-muted-foreground">
        {name}
      </Text>
    </View>
  );
};
