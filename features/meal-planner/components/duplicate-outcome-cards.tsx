import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export function DuplicateOutcomeCards<Choice extends string>({
  options,
  choice,
  disabled,
  onSelect,
  renderSelectedDetail,
}: {
  options: { id: Choice; label: string; description: string }[];
  choice: Choice;
  disabled: boolean;
  onSelect: (choice: Choice) => void;
  /** Extra controls shown inside the selected row, below its label. */
  renderSelectedDetail?: (choice: Choice) => ReactNode;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="How should this item be added?"
      className="gap-1"
    >
      {options.map(option => {
        const selected = choice === option.id;
        const detail = selected ? renderSelectedDetail?.(option.id) : null;
        return (
          // The detail sits outside the pressable so its inputs stay tappable.
          <View
            key={`${option.id}-${selected}`}
            className={cn('rounded-xl', selected && 'bg-muted')}
          >
            <HapticPressable
              accessibilityRole="radio"
              accessibilityLabel={`${option.label}. ${option.description}`}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onSelect(option.id)}
              className="min-h-11 flex-row items-center gap-3 px-3 py-2.5"
            >
              <Text className="flex-1 font-semibold">{option.label}</Text>
              <View className="size-5 items-center justify-center">
                {selected ? (
                  <Icon as={Check} size={20} className="text-primary" />
                ) : null}
              </View>
            </HapticPressable>
            {detail ? <View className="px-3 pb-3">{detail}</View> : null}
          </View>
        );
      })}
    </View>
  );
}
