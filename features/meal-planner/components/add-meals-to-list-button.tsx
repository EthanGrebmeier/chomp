import { ShoppingCartIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type AddMealsToListButtonProps = {
  unaddedCount: number;
  onPress: () => void;
};

export function AddMealsToListButton({
  unaddedCount,
  onPress,
}: AddMealsToListButtonProps) {
  return (
    <Button
      size="iconLg"
      variant="secondary"
      className={cn(
        'absolute bottom-12 left-6 z-10 h-10 w-24 transition-opacity',
        unaddedCount === 0 && 'opacity-50'
      )}
      onPress={onPress}
      accessibilityLabel={
        unaddedCount > 0
          ? `Review ${unaddedCount} meal plan entries to add to the grocery list`
          : 'Review meal plan entries for the grocery list'
      }
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
