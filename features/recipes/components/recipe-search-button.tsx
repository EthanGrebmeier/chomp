import { TextSearchIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';

type RecipeSearchButtonProps = {
  onPress: () => void;
  hasActiveFilters?: boolean;
};

export const RecipeSearchButton = ({
  onPress,
  hasActiveFilters = false,
}: RecipeSearchButtonProps) => {
  return (
    <View className="relative">
      <Button size="circle" variant="secondary" onPress={onPress}>
        <Icon
          strokeWidth={3}
          className="text-secondary-foreground"
          as={TextSearchIcon}
          size={16}
        />
      </Button>
      {hasActiveFilters ? (
        <View className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-background bg-primary" />
      ) : null}
    </View>
  );
};
