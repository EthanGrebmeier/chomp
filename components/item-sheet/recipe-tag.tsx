import { router } from 'expo-router';
import { XIcon } from 'lucide-react-native';

import { navigation } from '../../lib/navigation';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';

import { useEditItemSheet } from './edit-item/edit-item-sheet';
import { useItemSheet } from './use-item-sheet';

export const RecipeTag = () => {
  const { recipe, setRecipe } = useItemSheet();
  const { dismiss, clearRecipe } = useEditItemSheet();

  if (!recipe) {
    return null;
  }

  const handleGoToRecipe = () => {
    router.push(navigation.goToRecipe(recipe.id));
    dismiss();
  };

  // Fire the cloud unlink immediately alongside the local form-state clear
  // so the grocery item's recipe association detaches right away instead of
  // waiting for sheet dismissal (P5-T3).
  const handleClearRecipe = () => {
    clearRecipe(recipe.id);
    setRecipe(null);
  };

  return (
    <HapticPressable
      onPress={handleGoToRecipe}
      className="mt-2 flex-row items-center gap-2"
    >
      <Text className="text-sm font-semibold italic text-muted-foreground">
        {recipe.name}
      </Text>
      <HapticPressable
        onPress={handleClearRecipe}
        hitSlop={8}
        hapticType="light"
        className="ml-0.5"
      >
        <Icon as={XIcon} size={16} className="text-muted-foreground" />
      </HapticPressable>
    </HapticPressable>
  );
};
