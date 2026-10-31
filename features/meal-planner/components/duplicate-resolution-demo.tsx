import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { detectDuplicates } from '@/features/meal-planner/duplicate-resolution';
import {
  demoStoreLabel,
  formatDemoQuantity,
  getDefaultDemoChoice,
  getDefaultDemoCustomAmount,
  getDefaultDemoDecisions,
  getDemoChoiceOptions,
  getDemoChoiceDescription,
  getDemoComparisonTarget,
  getDemoCustomAmountUnits,
  getDemoCustomAmountStoreOptions,
  isDemoDecisionComplete,
  sortDemoConflictsForReview,
  type DemoChoice,
  type DemoCustomAmounts,
  type DemoDecisions,
} from '@/features/meal-planner/duplicate-resolution/demo-choices';
import {
  DEMO_LIST_ID,
  type DuplicateDemoScenario,
} from '@/features/meal-planner/duplicate-resolution/demo-fixtures';
import type {
  DuplicateConflict,
  DuplicateItemFields,
} from '@/features/meal-planner/duplicate-resolution/types';

import {
  ConflictIndexRow,
  type ConflictIndexTreatment,
} from './conflict-index-row';
import { DuplicateCustomAmountField } from './duplicate-custom-amount-field';
import { DuplicateOutcomeCards } from './duplicate-outcome-cards';

export type DuplicateDemoVariant = 'compact' | 'detailed';

type PageDirection = 'forward' | 'back';

const PAGE_ENTER_MS = 220;

/** First page fades in place; later pages slide in from the side they come from. */
const pageEntering = (direction: PageDirection | null) =>
  direction === 'forward'
    ? FadeInRight.duration(PAGE_ENTER_MS)
    : direction === 'back'
      ? FadeInLeft.duration(PAGE_ENTER_MS)
      : FadeIn.duration(PAGE_ENTER_MS);

function ComparisonCard({
  label,
  item,
}: {
  label: string;
  item: DuplicateItemFields;
}) {
  return (
    <View className="gap-2 rounded-2xl bg-muted p-4">
      <Text className="text-sm font-semibold text-muted-foreground">
        {label}
      </Text>
      <Text className="text-lg font-semibold">{item.name}</Text>
      <Text className="text-xl font-semibold" style={styles.tabular}>
        {formatDemoQuantity(item.quantity, item.unit)}
      </Text>
      <Text className="text-sm text-muted-foreground">
        Store: {demoStoreLabel(item.storeId)}
      </Text>
      <Text className="text-sm text-muted-foreground">
        Category: {item.category || 'None'}
      </Text>
      <Text className="text-sm text-muted-foreground">
        Notes: {item.notes || 'None'}
      </Text>
    </View>
  );
}

function ConflictComparison({
  conflict,
  variant,
  mealName,
}: {
  conflict: DuplicateConflict;
  variant: DuplicateDemoVariant;
  mealName: string;
}) {
  const existing = getDemoComparisonTarget(conflict);
  const storeMismatch =
    (existing.storeId || null) !== (conflict.incoming.storeId || null);
  const unitMismatch = getDemoCustomAmountUnits(conflict).length > 1;
  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-2xl font-semibold">
          {conflict.incoming.name}
        </Text>
        <Text className="text-sm text-muted-foreground">From {mealName}</Text>
      </View>
      {variant === 'detailed' ? (
        <>
          <ComparisonCard label="On your list" item={existing} />
          <ComparisonCard
            label="Adding from this meal"
            item={conflict.incoming}
          />
        </>
      ) : (
        <View className="gap-2">
          {[
            { label: 'On your list', item: existing },
            { label: 'Adding', item: conflict.incoming },
          ].map(({ label, item }) => (
            <View key={label} className="gap-1 rounded-xl bg-muted px-3 py-3">
              <View className="flex-row flex-wrap justify-between gap-2">
                <Text className="text-muted-foreground">{label}</Text>
                <Text className="font-semibold" style={styles.tabular}>
                  {formatDemoQuantity(item.quantity, item.unit)}
                </Text>
              </View>
              {storeMismatch ? (
                <Text className="text-sm text-muted-foreground">
                  {demoStoreLabel(item.storeId)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
      {!conflict.canIncrement && unitMismatch ? (
        <Text className="text-sm text-muted-foreground">
          {storeMismatch
            ? 'These items use different units and stores. Keep them separate, or set a combined total and choose its store.'
            : 'These items use different units. Keep them separate, or set a combined total. Quantities won’t be converted automatically.'}
        </Text>
      ) : null}
    </View>
  );
}

const customAmountHint = (conflict: DuplicateConflict) => {
  const existing = getDemoComparisonTarget(conflict);
  return `Replaces ${formatDemoQuantity(existing.quantity, existing.unit)} on your list. This meal needs ${formatDemoQuantity(conflict.incoming.quantity, conflict.incoming.unit)}.`;
};

/** Shared by the overview and the single-item view so both open the same way. */
function ConflictsHeading({ total }: { total: number }) {
  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="text-lg font-semibold">
        {total === 0
          ? 'No Conflicts Detected'
          : `${total} ${total === 1 ? 'Conflict' : 'Conflicts'} Detected`}
      </Text>
      {total > 0 ? (
        <Text className="text-sm text-muted-foreground">
          {total === 1
            ? 'This item is already on your list. How would you like to handle it?'
            : 'How would you like to handle them?'}
        </Text>
      ) : null}
    </View>
  );
}

export function DuplicateResolutionDemo({
  scenario,
  variant,
  indexTreatment = 'navigation',
  onDismiss,
}: {
  scenario: DuplicateDemoScenario;
  variant: DuplicateDemoVariant;
  indexTreatment?: ConflictIndexTreatment;
  onDismiss: () => void;
}) {
  const sheetRef = useRef<TrueSheet>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const detection = useMemo(
    () =>
      detectDuplicates({
        listId: DEMO_LIST_ID,
        incoming: scenario.incoming,
        existingItems: scenario.existingItems,
      }),
    [scenario]
  );
  const conflicts = useMemo(
    () => sortDemoConflictsForReview(detection.conflicts),
    [detection.conflicts]
  );
  const total = conflicts.length;
  // Every item starts with a sensible choice, so the index can be confirmed as-is.
  const [decisions, setDecisions] = useState<DemoDecisions>(() =>
    getDefaultDemoDecisions(conflicts)
  );
  // A lone duplicate skips the index: its detail page is the whole flow.
  const isSingle = total === 1;
  // null is the index; a number is the detail page for that conflict.
  const [index, setIndex] = useState<number | null>(isSingle ? 0 : null);
  const [direction, setDirection] = useState<PageDirection | null>(null);
  const [closing, setClosing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [footerHeight, setFooterHeight] = useState(200);
  const conflict = index === null ? null : conflicts[index];
  // Kept when switching away so the entered total returns if they switch back.
  const [customAmounts, setCustomAmounts] = useState<DemoCustomAmounts>({});
  // Only focus the amount right after choosing it, not on every page revisit.
  const [focusAmountId, setFocusAmountId] = useState<string | null>(null);
  const choiceFor = (item: DuplicateConflict) =>
    decisions[item.id] ?? getDefaultDemoChoice(item);
  const completeCount = conflicts.filter(item =>
    isDemoDecisionComplete(choiceFor(item), customAmounts[item.id])
  ).length;
  const allComplete = completeCount === total;
  const selectChoice = (item: DuplicateConflict, choice: DemoChoice) => {
    setDecisions(current => ({ ...current, [item.id]: choice }));
    if (choice !== 'custom-amount') return;
    setFocusAmountId(item.id);
    setCustomAmounts(current =>
      current[item.id]
        ? current
        : { ...current, [item.id]: getDefaultDemoCustomAmount(item) }
    );
  };

  useEffect(() => {
    void sheetRef.current?.present();
  }, []);
  useEffect(() => {
    if (!isOpen || closing) return;
    AccessibilityInfo.announceForAccessibility(
      isSingle && conflict
        ? `${conflict.incoming.name} is already on your list.`
        : conflict
          ? `Item ${(index ?? 0) + 1} of ${total}. ${conflict.incoming.name}.`
          : `${total} items already on your list.`
    );
  }, [closing, conflict, index, isOpen, isSingle, total]);

  // The index sits before the first item for direction purposes.
  const goTo = (nextIndex: number | null) => {
    setDirection((nextIndex ?? -1) >= (index ?? -1) ? 'forward' : 'back');
    setIndex(nextIndex);
    setFocusAmountId(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const footer = (
    <View
      className="gap-2 bg-background px-6 pt-3"
      style={{ paddingBottom: insets.bottom + 12 }}
      onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}
    >
      {conflict && index !== null && !isSingle ? (
        // Distinct keys stop React reusing Buttons across layouts; NativeWind
        // keeps stale styles (e.g. flex-1) when className changes in place.
        <View key="detail-footer" className="flex-row items-center gap-2">
          {/* Spacers keep Done centered when an arrow is hidden at either end. */}
          {index > 0 ? (
            <Button
              variant="outline"
              size="icon"
              className="size-12"
              accessibilityLabel="Previous item"
              disabled={closing}
              onPress={() => goTo(index - 1)}
            >
              <Icon as={ArrowLeft} size={20} />
            </Button>
          ) : (
            <View className="size-12" />
          )}
          <Button
            className="h-auto min-h-12 flex-1 py-3"
            accessibilityLabel="Done, back to all items"
            disabled={closing}
            onPress={() => goTo(null)}
          >
            <Text>Done</Text>
          </Button>
          {index < total - 1 ? (
            <Button
              variant="outline"
              size="icon"
              className="size-12"
              accessibilityLabel="Next item"
              disabled={closing}
              onPress={() => goTo(index + 1)}
            >
              <Icon as={ArrowRight} size={20} />
            </Button>
          ) : (
            <View className="size-12" />
          )}
        </View>
      ) : (
        <Button
          key="confirm-footer"
          className="h-auto min-h-12 py-3"
          accessibilityHint={
            allComplete ? undefined : 'Enter the missing amounts first.'
          }
          disabled={closing || !allComplete}
          onPress={() => void sheetRef.current?.dismiss()}
        >
          <Text>Add to list</Text>
        </Button>
      )}
    </View>
  );

  return (
    <BottomSheet
      ref={sheetRef}
      name="duplicate-resolution-demo"
      detents={variant === 'detailed' ? [1] : ['auto']}
      scrollable
      viewClassName={variant === 'detailed' ? 'flex-1' : undefined}
      footer={footer}
      onOpen={() => setIsOpen(true)}
      onStartClose={() => setClosing(true)}
      onDismiss={onDismiss}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        style={
          variant === 'compact' ? { maxHeight: height * 0.8 } : styles.fill
        }
        contentContainerStyle={{ paddingBottom: footerHeight + 24 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Keyed by page so content remounts and slides in from its side. */}
        <Animated.View
          key={index ?? 'index'}
          entering={pageEntering(direction)}
          className="gap-5 px-6"
        >
          {conflict && index !== null ? (
            <>
              {isSingle ? (
                <ConflictsHeading total={total} />
              ) : (
                <View className="flex-row items-center justify-between gap-3">
                  <HapticPressable
                    accessibilityRole="button"
                    accessibilityLabel="Back to all items"
                    disabled={closing}
                    onPress={() => goTo(null)}
                    className="-ml-2 min-h-12 flex-row items-center gap-1 px-2"
                  >
                    <Icon
                      as={ChevronLeft}
                      size={20}
                      className="text-muted-foreground"
                    />
                    <Text className="text-muted-foreground">All items</Text>
                  </HapticPressable>
                  <Text
                    accessibilityLabel={`Item ${index + 1} of ${total}`}
                    className="font-semibold text-muted-foreground"
                    style={styles.tabular}
                  >
                    {index + 1}/{total}
                  </Text>
                </View>
              )}
              <ConflictComparison
                conflict={conflict}
                variant={variant}
                mealName={scenario.mealName}
              />
              <View className="gap-3">
                <Text className="text-sm font-semibold">
                  How should this item be added?
                </Text>
                <DuplicateOutcomeCards
                  options={getDemoChoiceOptions(conflict).map(option => ({
                    ...option,
                    description: getDemoChoiceDescription(conflict, option.id),
                  }))}
                  choice={choiceFor(conflict)}
                  disabled={closing}
                  onSelect={choice => selectChoice(conflict, choice)}
                  renderSelectedDetail={choice =>
                    choice === 'custom-amount' ? (
                      <DuplicateCustomAmountField
                        amount={
                          customAmounts[conflict.id] ??
                          getDefaultDemoCustomAmount(conflict)
                        }
                        units={getDemoCustomAmountUnits(conflict)}
                        stores={getDemoCustomAmountStoreOptions(conflict)}
                        hint={customAmountHint(conflict)}
                        autoFocus={focusAmountId === conflict.id}
                        disabled={closing}
                        onChange={amount =>
                          setCustomAmounts(current => ({
                            ...current,
                            [conflict.id]: amount,
                          }))
                        }
                      />
                    ) : null
                  }
                />
              </View>
            </>
          ) : (
            <>
              <ConflictsHeading total={total} />
              <View className="gap-2">
                {conflicts.map((item, itemIndex) => (
                  <ConflictIndexRow
                    key={item.id}
                    treatment={indexTreatment}
                    conflict={item}
                    choice={choiceFor(item)}
                    customAmount={customAmounts[item.id]}
                    disabled={closing}
                    onPress={() => goTo(itemIndex)}
                  />
                ))}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});
