import { View } from 'react-native';

import { Text } from './ui/text';

type RecipeTagProps = {
  name: string;
};

export const RecipeTag = ({ name }: RecipeTagProps) => {
  if (!name) {
    return null;
  }

  return (
    <View className="flex-row items-center gap-1 ">
      <Text variant="caption" className="italic">
        {name}
      </Text>
    </View>
  );
};
