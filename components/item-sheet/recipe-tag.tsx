import { CookingPotIcon, XIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';

import { useItemSheet } from './use-item-sheet';

export const RecipeTag = () => {
  const { recipe, setRecipe } = useItemSheet();

  if (!recipe) {
    return null;
  }

  return (
    <View className="mt-2 flex-row items-center gap-2">
      <Icon as={CookingPotIcon} size={16} className="text-muted-foreground" />
      <Text className="text-base font-semibold text-muted-foreground">
        {recipe.name}
      </Text>
      <HapticPressable
        onPress={() => setRecipe(null)}
        hitSlop={8}
        hapticType="light"
        className="ml-0.5"
      >
        <Icon as={XIcon} size={16} className="text-muted-foreground" />
      </HapticPressable>
    </View>
  );
};
