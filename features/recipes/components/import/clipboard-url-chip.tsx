import { ClipboardPasteIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type ClipboardUrlChipProps = {
  onPress: () => void;
};

/**
 * One-tap shortcut shown when the clipboard looks like it holds a link.
 */
export const ClipboardUrlChip = ({ onPress }: ClipboardUrlChipProps) => (
  <View className="items-center">
    <HapticPressable
      onPress={onPress}
      hapticType="light"
      accessibilityRole="button"
      accessibilityLabel="Paste link from clipboard"
      className="flex-row items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 active:bg-primary/20"
    >
      <Icon as={ClipboardPasteIcon} className="size-4 text-primary" />
      <Text className="text-sm font-medium text-primary">
        Paste link from clipboard
      </Text>
    </HapticPressable>
  </View>
);
