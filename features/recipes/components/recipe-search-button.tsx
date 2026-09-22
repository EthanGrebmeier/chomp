import { SearchIcon } from 'lucide-react-native';
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
          as={SearchIcon}
          size={16}
        />
      </Button>
      {hasActiveFilters ? (
        <View className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border border-background bg-primary" />
      ) : null}
    </View>
  );
};
