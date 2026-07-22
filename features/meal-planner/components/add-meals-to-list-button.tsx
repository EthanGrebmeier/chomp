import { router } from 'expo-router';
import { ShoppingCartIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { navigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import { useUserMealPlanData } from '../hooks/useUserMealPlanData';

type AddMealsToListButtonProps = {
  listId: string;
};

export function AddMealsToListButton({ listId }: AddMealsToListButtonProps) {
  const { recipes, items } = useUserMealPlanData(listId);
  const unaddedCount =
    recipes.filter(recipe => !recipe.addedToList).length +
    items.filter(item => !item.addedToList).length;

  const handlePress = () => {
    router.push(navigation.goToMealPlanAddToList(listId));
  };

  return (
    <Button
      size="iconLg"
      variant="secondary"
      className={cn(
        'absolute bottom-12 left-6 z-10 h-10 w-24 transition-opacity',
        unaddedCount === 0 && 'opacity-50'
      )}
      onPress={handlePress}
    >
      <View className="flex-row items-center gap-2">
        <Icon
          as={ShoppingCartIcon}
          size={20}
          strokeWidth={3}
          className="text-secondary-foreground"
        />
        {unaddedCount > 0 ? (
          <Text className="text-xl font-bold text-secondary-foreground">
            {unaddedCount}
          </Text>
        ) : null}
      </View>
    </Button>
  );
}
