import { ChevronRight, Scale, Store } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export const CONFLICT_INDEX_TREATMENTS = [
  { id: 'original', label: 'Original cards' },
  { id: 'edit', label: 'Edit action' },
  { id: 'footer', label: 'Action footer' },
  { id: 'navigation', label: 'Navigation rows' },
] as const;

export type ConflictIndexTreatment =
  (typeof CONFLICT_INDEX_TREATMENTS)[number]['id'];

export function ConflictReviewRow({
  treatment = 'navigation',
  name,
  detail,
  summary,
  accessibilitySummary,
  differences = [],
  complete = true,
  disabled,
  onPress,
}: {
  treatment?: ConflictIndexTreatment;
  name: string;
  detail: string;
  summary: string;
  accessibilitySummary: string;
  differences?: string[];
  complete?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <HapticPressable
      accessibilityRole="button"
      accessibilityLabel={`${name}: ${accessibilitySummary}`}
      accessibilityState={{ disabled }}
      accessibilityHint="Opens this item to change how it is added."
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'min-h-12 gap-1 py-4',
        treatment !== 'navigation' && 'px-4',
        treatment === 'original' && 'rounded-2xl bg-muted',
        treatment === 'edit' &&
          'rounded-2xl border border-primary/25 bg-primary/5',
        treatment === 'footer' &&
          'overflow-hidden rounded-2xl border border-border bg-background',
        treatment === 'navigation' && 'border-b border-border bg-background'
      )}
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.65 : 1,
      })}
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 font-semibold">{name}</Text>
        {differences.length > 0 ? (
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="shrink-0 flex-row items-center gap-1"
          >
            {differences.includes('Different stores') ? (
              <View className="rounded-md bg-amber-500/10 p-1">
                <Icon
                  as={Store}
                  size={16}
                  className="text-amber-700 dark:text-amber-400"
                />
              </View>
            ) : null}
            {differences.includes('Different quantities') ||
            differences.includes('Different units') ? (
              <View className="rounded-md bg-amber-500/10 p-1">
                <Icon
                  as={Scale}
                  size={16}
                  className="text-amber-700 dark:text-amber-400"
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-1">
          <Text
            className="text-sm text-muted-foreground"
            style={styles.tabular}
          >
            {detail}
          </Text>
          <Text
            key={complete ? 'selected' : 'needs-amount'}
            className={cn(
              'text-sm font-medium',
              !complete && 'text-destructive'
            )}
          >
            {summary}
          </Text>
        </View>
        {treatment === 'edit' ? (
          <View className="min-h-11 flex-row items-center gap-1 rounded-full bg-primary px-4">
            <Text className="font-semibold text-primary-foreground">Edit</Text>
            <Icon
              as={ChevronRight}
              size={16}
              className="text-primary-foreground"
            />
          </View>
        ) : treatment !== 'footer' ? (
          <Icon
            as={ChevronRight}
            size={treatment === 'navigation' ? 24 : 20}
            className="text-muted-foreground"
          />
        ) : null}
      </View>
      {treatment === 'footer' ? (
        <View className="mt-3 min-h-11 flex-row items-center justify-between gap-3 border-t border-border pt-3">
          <Text className="flex-1 font-semibold text-primary">
            Change how it’s added
          </Text>
          <Icon as={ChevronRight} size={20} className="text-primary" />
        </View>
      ) : null}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
});
