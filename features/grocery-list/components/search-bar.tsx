import { SearchIcon } from 'lucide-react-native';
import { forwardRef } from 'react';
import { TextInput as RNTextInput, View } from 'react-native';

import { TextInput } from '../../../components/text-input';
import { Icon } from '../../../components/ui/icon';

type SearchBarProps = {
  inputKey: number;
  defaultValue: string;
  onChangeText: (text: string) => void;
};

export const SearchBar = forwardRef<RNTextInput, SearchBarProps>(
  ({ inputKey, defaultValue, onChangeText }, ref) => {
    return (
      <View className="px-4">
        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-0 z-10 h-full justify-center">
            <Icon as={SearchIcon} size={18} className="text-muted-foreground" />
          </View>
          <TextInput
            key={inputKey}
            ref={ref}
            className="pl-10"
            placeholder="Search items..."
            defaultValue={defaultValue}
            onChangeText={onChangeText}
            autoCorrect={false}
          />
        </View>
      </View>
    );
  }
);

SearchBar.displayName = 'SearchBar';
