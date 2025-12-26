import { router } from 'expo-router';
import { CookingPotIcon, XIcon } from 'lucide-react-native';

import { navigation } from '../../lib/navigation';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';

import { useEditItemSheet } from './edit-item/edit-item-sheet';
import { useItemSheet } from './use-item-sheet';

export const RecipeTag = () => {
  const { recipe, setRecipe } = useItemSheet();
  const { dismiss } = useEditItemSheet();

  if (!recipe) {
    return null;
  }

  const handleGoToRecipe = () => {
    router.push(navigation.goToRecipe(recipe.id));
    dismiss();
  };

  return (
    <HapticPressable
      onPress={handleGoToRecipe}
      className="mt-2 flex-row items-center gap-2"
    >
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
    </HapticPressable>
  );
};
