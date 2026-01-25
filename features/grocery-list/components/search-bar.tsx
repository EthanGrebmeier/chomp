import { SearchIcon } from 'lucide-react-native';
import { forwardRef } from 'react';
import { Text, TextInput as RNTextInput, View } from 'react-native';

import { TextInput } from '../../../components/text-input';
import { Icon } from '../../../components/ui/icon';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  totalItems: number;
  matchingCount: number;
};

export const SearchBar = forwardRef<RNTextInput, SearchBarProps>(
  ({ value, onChangeText, totalItems, matchingCount }, ref) => {
    const trimmedQuery = value.trim();
    const hasSearch = trimmedQuery.length > 0;

    return (
      <View className="px-4">
        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-0 z-10 h-full justify-center">
            <Icon as={SearchIcon} size={18} className="text-muted-foreground" />
          </View>
          <TextInput
            ref={ref}
            className="pl-10"
            placeholder="Search items..."
            value={value}
            onChangeText={onChangeText}
            autoCorrect={false}
          />
        </View>
        <Text className="mt-1 text-sm text-muted-foreground">
          {hasSearch
            ? `${matchingCount} item${matchingCount !== 1 ? 's' : ''} matching "${trimmedQuery}"`
            : `${totalItems} item${totalItems !== 1 ? 's' : ''}`}
        </Text>
      </View>
    );
  }
);

SearchBar.displayName = 'SearchBar';
