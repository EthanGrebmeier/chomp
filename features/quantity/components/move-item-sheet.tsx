import { CheckIcon } from 'lucide-react-native';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

import { Sheet } from './sheet';
import { useSheetController } from './use-sheet-controller';

export function MoveItemSheet({
  lists,
  selectedListId,
  onSelect,
  onDismiss,
}: {
  lists: { id: string; name: string }[];
  selectedListId: string;
  onSelect: (listId: string) => void;
  onDismiss: () => void;
}) {
  const controller = useSheetController(onDismiss);

  return (
    <Sheet title="Choose a shopping list" controller={controller}>
      {lists.length === 0 ? (
        <Text className="text-center text-muted-foreground">
          No shopping lists available.
        </Text>
      ) : null}
      {lists.map(list => (
        <HapticPressable
          key={list.id}
          accessibilityRole="button"
          accessibilityLabel={list.name}
          accessibilityState={{ selected: list.id === selectedListId }}
          className={cn(
            'min-h-12 flex-row items-center gap-3 rounded-xl px-3 py-3',
            list.id === selectedListId && 'bg-muted'
          )}
          onPress={() => {
            void controller.dismiss(
              list.id === selectedListId ? undefined : () => onSelect(list.id)
            );
          }}
        >
          <Text className="flex-1 font-medium">{list.name}</Text>
          {list.id === selectedListId ? (
            <Icon as={CheckIcon} size={18} />
          ) : null}
        </HapticPressable>
      ))}
    </Sheet>
  );
}
