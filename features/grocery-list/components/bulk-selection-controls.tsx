import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type BulkSelectionControlsProps = {
  selectedItemCount: number;
  onSelectAll: () => void;
  onClearAll: () => void;
};

export function BulkSelectionControls({
  selectedItemCount,
  onSelectAll,
  onClearAll,
}: BulkSelectionControlsProps) {
  return (
    <View className="h-12 flex-row items-center gap-2 px-4">
      <Button
        variant="ghost"
        className="h-8 px-0"
        onPress={onSelectAll}
        hitSlop={14}
      >
        <Text className="text-sm font-medium text-foreground">Select All</Text>
      </Button>
      <Button
        variant="ghost"
        className="h-8 px-0"
        onPress={onClearAll}
        disabled={selectedItemCount === 0}
        hitSlop={14}
      >
        <Text className="text-sm font-medium text-foreground">Clear All</Text>
      </Button>
    </View>
  );
}
