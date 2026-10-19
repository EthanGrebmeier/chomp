import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { DemoChoice } from '@/features/meal-planner/duplicate-resolution/demo-choices';
import { cn } from '@/lib/utils';

export function DuplicateOutcomeCards({
  options,
  choice,
  disabled,
  onSelect,
  renderSelectedDetail,
}: {
  options: { id: DemoChoice; label: string; description: string }[];
  choice: DemoChoice;
  disabled: boolean;
  onSelect: (choice: DemoChoice) => void;
  /** Extra controls shown inside the selected card, below its label. */
  renderSelectedDetail?: (choice: DemoChoice) => ReactNode;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="How should this item be added?"
      className="gap-2"
    >
      {options.map(option => {
        const selected = choice === option.id;
        const detail = selected ? renderSelectedDetail?.(option.id) : null;
        return (
          // The detail sits outside the pressable so its inputs stay tappable.
          <View
            key={`${option.id}-${selected}`}
            className={cn(
              'rounded-2xl border border-border',
              selected && 'border-primary bg-muted'
            )}
          >
            <HapticPressable
              accessibilityRole="radio"
              accessibilityLabel={`${option.label}. ${option.description}`}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onSelect(option.id)}
              className="min-h-12 flex-row items-center gap-3 p-4"
            >
              <View
                className={cn(
                  'size-6 items-center justify-center rounded-full border border-muted-foreground',
                  selected && 'border-primary bg-primary'
                )}
              >
                {selected ? (
                  <Icon
                    as={Check}
                    size={16}
                    className="text-primary-foreground"
                  />
                ) : null}
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-semibold">{option.label}</Text>
                <Text
                  className="text-sm text-muted-foreground"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {option.description}
                </Text>
              </View>
            </HapticPressable>
            {detail ? <View className="px-4 pb-4">{detail}</View> : null}
          </View>
        );
      })}
    </View>
  );
}
