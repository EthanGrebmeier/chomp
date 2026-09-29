import { TextSearchIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from './button';
import { Icon } from './icon';

type SearchButtonProps = {
  onPress: () => void;
  /** Shows an indicator dot when search or filters are applied. */
  hasActiveFilters?: boolean;
  accessibilityLabel?: string;
};

export const SearchButton = ({
  onPress,
  hasActiveFilters = false,
  accessibilityLabel = 'Search',
}: SearchButtonProps) => {
  return (
    <View className="relative">
      <Button
        size="icon"
        variant="secondary"
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
      >
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
