import { ArrowRightLeft, Store, Tags, Trash2, X } from 'lucide-react-native';
import { View } from 'react-native';

import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { cn } from '../../../lib/utils';
import {
  BulkToolbarActionId,
  getBulkToolbarActions,
} from '../bulk-selection/toolbar';

type BulkSelectionToolbarProps = {
  selectedItemCount: number;
  onActionPress: (actionId: BulkToolbarActionId) => void;
};

const bulkToolbarIcons = {
  exit: X,
  'set-store': Store,
  'set-category': Tags,
  move: ArrowRightLeft,
  delete: Trash2,
} as const;

export const BulkSelectionToolbar = ({
  selectedItemCount,
  onActionPress,
}: BulkSelectionToolbarProps) => {
  const bulkToolbarActions = getBulkToolbarActions(selectedItemCount);

  return (
    <View className="h-12 flex-row items-center justify-between gap-4 rounded-full border border-border bg-accent/90 px-5 shadow-sm">
      {bulkToolbarActions.map(action => (
        <HapticPressable
          key={action.id}
          onPress={() => onActionPress(action.id)}
          disabled={action.isDisabled}
          haptic={!action.isDisabled}
          hapticType="selection"
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{ disabled: action.isDisabled }}
          className={cn(
            'items-center gap-1 px-1.5',
            action.isDisabled && 'opacity-40'
          )}
        >
          <Icon
            as={bulkToolbarIcons[action.id]}
            size={24}
            strokeWidth={2.25}
            className={
              action.isDestructive ? 'text-destructive' : 'text-foreground'
            }
          />
        </HapticPressable>
      ))}
    </View>
  );
};
