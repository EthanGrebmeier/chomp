import { ArrowUpRight, ChevronRight, Plus } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { formatQuantity } from '../model';
import type { QuantityEntry } from '../types';

function sourceDetail(entry: QuantityEntry) {
  if (entry.sourceId)
    return `Planned for ${entry.mealTag.toLowerCase()} on ${new Date(`${entry.sourceDate}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  if (entry.origin === 'recipe') return 'Added from recipe';
  if (entry.origin === 'scheduled' || entry.origin === 'planned')
    return 'Purchased from meal plan';
  return 'Added manually';
}

const reveal = FadeIn.duration(120).reduceMotion(ReduceMotion.System);

export function QuantitySection({
  entries,
  total,
  itemName,
  unit,
  history,
  expanded,
  onToggle,
  onAdd,
  onSelect,
}: {
  entries: QuantityEntry[];
  total: number;
  itemName: string;
  unit: string;
  history: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onSelect: (entry: QuantityEntry) => void;
}) {
  const formattedTotal = formatQuantity(total);

  return (
    <View className="mt-2">
      <HapticPressable
        accessibilityRole="button"
        accessibilityLabel={`Quantity, ${formattedTotal} ${unit}`}
        accessibilityHint={
          expanded ? 'Hide quantity breakdown' : 'Show quantity breakdown'
        }
        accessibilityState={{ expanded }}
        hapticType="selection"
        onPress={onToggle}
        className="min-h-12 flex-row items-center gap-3 py-2 active:opacity-60"
      >
        <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Text className="text-lg font-semibold">Quantity</Text>
          <Text
            className="text-base font-medium"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formattedTotal} {unit}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
          <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
        </View>
      </HapticPressable>
      {expanded ? (
        <Animated.View entering={reveal} className="mt-1 px-4">
          {entries.length === 0 ? (
            <Text className="py-4 text-muted-foreground">
              {history
                ? 'No quantities recorded.'
                : 'No quantity yet. Add an amount to put this item on your shopping list.'}
            </Text>
          ) : null}
          {entries.map((entry, index) => (
            <HapticPressable
              key={entry.id}
              disabled={history}
              accessibilityRole={history ? undefined : 'button'}
              accessibilityState={{ disabled: history }}
              accessibilityLabel={`${entry.sourceId ? 'Open meal plan for' : 'Adjust quantity for'} ${entry.sourceName || itemName}, ${entry.quantity} ${unit}`}
              onPress={() => onSelect(entry)}
              className="min-h-16 flex-row items-center gap-3 border-border py-3"
              style={{
                borderBottomWidth: index === entries.length - 1 ? 0 : 1,
              }}
            >
              <View className="flex-1 gap-1">
                <Text className="font-medium">
                  {entry.origin === 'manual'
                    ? 'Added Manually'
                    : entry.sourceName || 'Quantity'}
                </Text>
                {entry.origin !== 'manual' && entry.sourceNotes ? (
                  <Text className="text-sm">{entry.sourceNotes}</Text>
                ) : null}
                {entry.origin !== 'manual' ? (
                  <Text className="text-sm text-muted-foreground">
                    {sourceDetail(entry)}
                  </Text>
                ) : null}
              </View>
              <Text
                className="font-medium"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatQuantity(entry.quantity)} {unit}
              </Text>
              {!history ? (
                <Icon
                  as={entry.sourceId ? ArrowUpRight : ChevronRight}
                  size={18}
                  className="text-muted-foreground"
                />
              ) : null}
            </HapticPressable>
          ))}
          {!history ? (
            <View
              className={
                entries.length > 0 ? 'border-t border-border py-1' : 'pb-1'
              }
            >
              <HapticPressable
                accessibilityRole="button"
                onPress={onAdd}
                className="min-h-12 flex-row items-center gap-2 py-3 active:opacity-60"
              >
                <Icon as={Plus} size={18} className="text-primary" />
                <Text className="font-medium text-primary">Add quantity</Text>
              </HapticPressable>
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}
