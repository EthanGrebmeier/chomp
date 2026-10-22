import { ChevronDownIcon } from 'lucide-react-native';
import { View } from 'react-native';

import {
  SUGGESTION_STYLES,
  getSuggestionTreatment,
  setSuggestionStyle,
  useSuggestionStyle,
} from '@/components/item-sheet/add-item/suggestion-style';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components/native-dropdown';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export const SuggestionStyleMenu = () => {
  const selectedStyle = useSuggestionStyle();
  const selectedLabel = getSuggestionTreatment(selectedStyle).label;

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Suggestion style: ${selectedLabel}. Change style`}
          className="min-h-11 flex-row items-center justify-between gap-3 border-t border-border pt-4"
        >
          <View className="flex-1">
            <Text className="font-medium">Suggestion style</Text>
            <Text variant="caption">Temporary preview · resets on reload</Text>
          </View>
          <Text>{selectedLabel}</Text>
          <Icon
            as={ChevronDownIcon}
            size={16}
            className="text-muted-foreground"
          />
        </View>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SUGGESTION_STYLES.map(style => (
          <DropdownMenuCheckboxItem
            key={style.value}
            value={selectedStyle === style.value ? 'on' : 'off'}
            onValueChange={() => setSuggestionStyle(style.value)}
          >
            <DropdownMenuItemTitle>{style.label}</DropdownMenuItemTitle>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
