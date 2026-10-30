import { TextSearchIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { HeaderActionButton } from './header-action';

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
      <HeaderActionButton
        icon={TextSearchIcon}
        variant="ghost"
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
      />
      {hasActiveFilters ? (
        <View className="absolute right-0.5 top-0.5 size-3 rounded-full border-2 border-background bg-primary" />
      ) : null}
    </View>
  );
};
