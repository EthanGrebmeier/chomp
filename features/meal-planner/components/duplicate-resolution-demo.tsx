import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '@/components/ui/dropdown-menu';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  applyChoiceToRemaining,
  detectDuplicates,
  getDuplicateProgress,
  planDuplicateResolution,
  recordDecision,
} from '@/features/meal-planner/duplicate-resolution';
import {
  DEMO_LIST_ID,
  DEMO_STORE_NAMES,
  type DuplicateDemoScenario,
} from '@/features/meal-planner/duplicate-resolution/demo-fixtures';
import { getDemoIncrementPreviewQuantity } from '@/features/meal-planner/duplicate-resolution/demo-presentation';
import type {
  DuplicateConflict,
  DuplicateDecisions,
  DuplicateItemFields,
  DuplicateResolutionChoice,
  DuplicateResolutionPlan,
} from '@/features/meal-planner/duplicate-resolution/types';
import { cn } from '@/lib/utils';

export type DuplicateDemoVariant = 'compact' | 'detailed';

const quantityLabel = (quantity: number, unit: string) =>
  `${Number(quantity.toFixed(4))} ${unit}`.trim();
const storeLabel = (storeId?: string | null) =>
  storeId ? (DEMO_STORE_NAMES[storeId] ?? storeId) : 'No store';
const choiceLabel = (choice?: DuplicateResolutionChoice) =>
  choice === 'increment'
    ? 'Increment quantity'
    : choice === 'separate'
      ? 'Create separate item'
      : 'Not decided';

function CompactChoiceSelector({
  choice,
  canIncrement,
  disabled,
  onSelect,
}: {
  choice: DuplicateResolutionChoice;
  canIncrement: boolean;
  disabled: boolean;
  onSelect: (choice: DuplicateResolutionChoice) => void;
}) {
  return (
    <DropdownMenuRoot
      trigger={
        <View
          accessibilityLabel={`How to add this item: ${choiceLabel(choice)}`}
          className="min-h-12 flex-row items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3"
        >
          <Text className="flex-1 font-semibold">{choiceLabel(choice)}</Text>
          <Icon as={ChevronDown} size={18} />
        </View>
      }
    >
      <DropdownMenuContent>
        <DropdownMenuItem
          key="increment"
          disabled={disabled || !canIncrement}
          onSelect={() => onSelect('increment')}
        >
          <DropdownMenuItemTitle>
            Increment quantity{choice === 'increment' ? ' ✓' : ''}
          </DropdownMenuItemTitle>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="separate"
          disabled={disabled}
          onSelect={() => onSelect('separate')}
        >
          <DropdownMenuItemTitle>
            Create separate item{choice === 'separate' ? ' ✓' : ''}
          </DropdownMenuItemTitle>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}

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
        {quantityLabel(item.quantity, item.unit)}
      </Text>
      <Text className="text-sm text-muted-foreground">
        Store: {storeLabel(item.storeId)}
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
  combinedQuantity,
  mealName,
}: {
  conflict: DuplicateConflict;
  variant: DuplicateDemoVariant;
  combinedQuantity: number | null;
  mealName: string;
}) {
  const target = conflict.candidates.find(
    item => item.id === conflict.targetId
  );
  const existing = target ?? conflict.candidates[0];
  const blockedMessage =
    conflict.incrementBlockedReason === 'unit'
      ? 'These items use different units. Create a separate item; this demo does not convert units.'
      : conflict.incrementBlockedReason === 'store'
        ? 'These items are assigned to different stores. Create a separate item to keep their stores.'
        : 'The existing items have different units or stores. Create a separate item.';

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
        <View className="gap-3 rounded-2xl bg-muted p-4">
          <View className="flex-row flex-wrap justify-between gap-2">
            <Text className="text-muted-foreground">On your list</Text>
            <Text className="font-semibold" style={styles.tabular}>
              {quantityLabel(existing.quantity, existing.unit)}
            </Text>
          </View>
          <View className="flex-row flex-wrap justify-between gap-2">
            <Text className="text-muted-foreground">Adding</Text>
            <Text className="font-semibold" style={styles.tabular}>
              {quantityLabel(
                conflict.incoming.quantity,
                conflict.incoming.unit
              )}
            </Text>
          </View>
          {existing.storeId !== conflict.incoming.storeId ? (
            <Text className="text-sm text-muted-foreground">
              {storeLabel(existing.storeId)} →{' '}
              {storeLabel(conflict.incoming.storeId)}
            </Text>
          ) : null}
        </View>
      )}
      {target && variant === 'detailed' ? (
        <View className="gap-1">
          <Text className="text-sm text-muted-foreground">
            Total if combined, including staged choices
          </Text>
          <Text className="text-xl font-semibold" style={styles.tabular}>
            {quantityLabel(
              combinedQuantity ?? target.quantity + conflict.incoming.quantity,
              target.unit
            )}
          </Text>
          {conflict.candidates.length > 1 ? (
            <Text className="text-sm text-muted-foreground">
              {conflict.candidates.length} matching items. Using the most
              recently updated compatible item shown above.
            </Text>
          ) : null}
        </View>
      ) : !target ? (
        <Text
          accessibilityLiveRegion="polite"
          className="text-sm text-muted-foreground"
        >
          {blockedMessage}
        </Text>
      ) : conflict.candidates.length > 1 ? (
        <Text className="text-sm text-muted-foreground">
          {conflict.candidates.length} matching items. Using the most recently
          updated compatible item shown above.
        </Text>
      ) : null}
      {!target && variant === 'detailed' && conflict.candidates.length > 1 ? (
        <View className="gap-2">
          <Text className="font-semibold">Other same-name items</Text>
          {conflict.candidates.slice(1).map(item => (
            <Text key={item.id} className="text-sm text-muted-foreground">
              {quantityLabel(item.quantity, item.unit)} ·{' '}
              {storeLabel(item.storeId)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function DuplicateResolutionDemo({
  scenario,
  variant,
  onDismiss,
}: {
  scenario: DuplicateDemoScenario;
  variant: DuplicateDemoVariant;
  onDismiss: () => void;
}) {
  const sheetRef = useRef<TrueSheet>(null);
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
  const [decisions, setDecisions] = useState<DuplicateDecisions>({});
  const [draftChoices, setDraftChoices] = useState<DuplicateDecisions>({});
  const [index, setIndex] = useState<number | null>(
    detection.conflicts.length > 0 ? 0 : null
  );
  const [applyRemaining, setApplyRemaining] = useState(false);
  const [status, setStatus] = useState('');
  const [confirmedPlan, setConfirmedPlan] =
    useState<DuplicateResolutionPlan | null>(null);
  const [closing, setClosing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [footerHeight, setFooterHeight] = useState(200);
  const progress = getDuplicateProgress(detection.conflicts, decisions);
  const conflict = index === null ? null : detection.conflicts[index];
  const currentChoice = conflict ? decisions[conflict.id] : undefined;
  const selectedChoice = conflict
    ? (draftChoices[conflict.id] ??
      currentChoice ??
      (conflict.canIncrement ? 'increment' : 'separate'))
    : 'separate';
  const combinedQuantity = getDemoIncrementPreviewQuantity({
    conflict,
    detection,
    decisions,
    existingItems: scenario.existingItems,
  });

  useEffect(() => {
    void sheetRef.current?.present();
  }, []);

  useEffect(() => {
    if (!isOpen || closing) return;
    AccessibilityInfo.announceForAccessibility(
      confirmedPlan
        ? 'Demo complete. Nothing saved.'
        : conflict
          ? `Duplicate ${(index ?? 0) + 1} of ${progress.total}. ${conflict.incoming.name}. ${progress.resolved} resolved. ${status}`
          : `Review choices. ${progress.resolved} of ${progress.total} duplicates resolved. ${status}`
    );
  }, [
    closing,
    confirmedPlan,
    conflict,
    index,
    isOpen,
    progress.resolved,
    progress.total,
    status,
  ]);

  const goTo = (nextIndex: number | null) => {
    setIndex(nextIndex);
    setApplyRemaining(false);
    setStatus('');
  };

  const selectChoice = (choice: DuplicateResolutionChoice) => {
    if (
      !conflict ||
      closing ||
      (choice === 'increment' && !conflict.canIncrement)
    )
      return;
    let nextDecisions: DuplicateDecisions;
    if (applyRemaining) {
      const batch = applyChoiceToRemaining({
        conflicts: detection.conflicts,
        decisions,
        choice,
        currentConflictId: conflict.id,
      });
      nextDecisions = batch.decisions;
      setStatus(
        batch.remainingCount > 0
          ? `Applied to ${batch.appliedCount} items; ${batch.remainingCount} need a separate choice.`
          : `Applied to ${batch.appliedCount} items. All duplicates are resolved.`
      );
    } else {
      nextDecisions = recordDecision(decisions, conflict.id, choice);
      setStatus('');
    }
    setDecisions(nextDecisions);
    setDraftChoices({});
    setApplyRemaining(false);
    const nextIndex = detection.conflicts.findIndex(
      item => !nextDecisions[item.id]
    );
    setIndex(
      variant === 'compact' && !applyRemaining
        ? index !== null && index + 1 < detection.conflicts.length
          ? index + 1
          : null
        : nextIndex < 0
          ? null
          : nextIndex
    );
  };

  const confirm = () => {
    if (closing) return;
    const result = planDuplicateResolution({
      detection,
      decisions,
      existingItems: scenario.existingItems,
    });
    if (result.ok) {
      setConfirmedPlan(result.plan);
      setStatus('');
    } else {
      setStatus(result.errors.map(error => error.message).join(' '));
    }
  };

  const footer = (
    <View
      className="gap-2 bg-background px-6 pt-3"
      style={{ paddingBottom: insets.bottom + 12 }}
      onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}
    >
      {conflict && !confirmedPlan && variant === 'compact' ? (
        <View className="flex-row items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-12"
            accessibilityLabel="Previous duplicate"
            disabled={closing || index === 0}
            onPress={() => goTo((index ?? 0) - 1)}
          >
            <Icon as={ArrowLeft} size={20} />
          </Button>
          <View className="flex-1 items-center gap-1">
            <Text className="font-semibold" style={styles.tabular}>
              Duplicate {(index ?? 0) + 1} of {progress.total}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {progress.resolved} resolved
            </Text>
          </View>
          <Button
            size="icon"
            className="size-12"
            accessibilityLabel={
              applyRemaining
                ? 'Apply choice to remaining duplicates'
                : index === detection.conflicts.length - 1
                  ? 'Apply choice and review'
                  : 'Apply choice and go to next duplicate'
            }
            accessibilityHint={`Stages ${choiceLabel(selectedChoice).toLowerCase()}. Nothing is saved yet.`}
            disabled={closing}
            onPress={() => selectChoice(selectedChoice)}
          >
            <Icon
              as={ArrowRight}
              size={20}
              className="text-primary-foreground"
            />
          </Button>
        </View>
      ) : conflict && !confirmedPlan ? (
        <>
          <Button
            className="h-auto min-h-12 py-3"
            onPress={() => selectChoice('increment')}
            disabled={!conflict.canIncrement || closing}
            accessibilityState={{
              disabled: !conflict.canIncrement || closing,
              selected: currentChoice === 'increment',
            }}
          >
            <Text className="text-center">
              Increment quantity
              {currentChoice === 'increment' ? ' · Selected' : ''}
            </Text>
          </Button>
          <Button
            variant="outline"
            className="h-auto min-h-12 py-3"
            onPress={() => selectChoice('separate')}
            disabled={closing}
            accessibilityState={{ selected: currentChoice === 'separate' }}
          >
            <Text className="text-center">
              Create separate item
              {currentChoice === 'separate' ? ' · Selected' : ''}
            </Text>
          </Button>
          {variant === 'detailed' ? (
            <Text className="text-center text-sm text-muted-foreground">
              Increment keeps the existing item’s details. Separate keeps this
              meal’s item independent.
            </Text>
          ) : null}
        </>
      ) : !confirmedPlan ? (
        <Button
          className="h-auto min-h-12 py-3"
          onPress={confirm}
          disabled={closing || progress.resolved !== progress.total}
        >
          <Text className="text-center">Confirm demo choices</Text>
        </Button>
      ) : null}
      <View
        className="flex-row gap-2"
        style={
          variant === 'compact' && conflict && !confirmedPlan
            ? styles.hidden
            : undefined
        }
      >
        {!confirmedPlan && !(variant === 'compact' && conflict) ? (
          <Button
            variant="ghost"
            className={
              variant === 'compact' ? 'size-12' : 'h-auto min-h-12 flex-1 py-3'
            }
            accessibilityLabel="Back to previous duplicate"
            disabled={
              closing ||
              (index !== null ? index === 0 : detection.conflicts.length === 0)
            }
            onPress={() =>
              goTo(index === null ? detection.conflicts.length - 1 : index - 1)
            }
          >
            {variant === 'compact' ? (
              <Icon as={ArrowLeft} size={20} />
            ) : (
              <Text>Back</Text>
            )}
          </Button>
        ) : null}
        {confirmedPlan || variant === 'detailed' ? (
          <Button
            variant="ghost"
            className="h-auto min-h-12 flex-1 py-3"
            disabled={closing}
            onPress={() => void sheetRef.current?.dismiss()}
          >
            <Text>{confirmedPlan ? 'Close demo' : 'Cancel'}</Text>
          </Button>
        ) : null}
      </View>
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
        style={
          variant === 'compact' ? { maxHeight: height * 0.8 } : styles.fill
        }
        contentContainerStyle={{ paddingBottom: footerHeight + 24 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="gap-5 px-6">
          <View className="gap-1">
            <Text accessibilityRole="header" className="text-lg font-semibold">
              {confirmedPlan
                ? 'Demo result'
                : conflict
                  ? 'Resolve duplicate items'
                  : 'Review your choices'}
            </Text>
            {!conflict || confirmedPlan ? (
              <Text className="text-sm text-muted-foreground">
                {scenario.mealName}
              </Text>
            ) : null}
          </View>
          {conflict && !confirmedPlan ? (
            <>
              {variant === 'detailed' ? (
                <View className="gap-2">
                  <Text className="font-semibold" style={styles.tabular}>
                    Duplicate {(index ?? 0) + 1} of {progress.total}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {progress.resolved} of {progress.total} resolved
                  </Text>
                  {variant === 'detailed' ? (
                    <View
                      accessibilityRole="progressbar"
                      accessibilityLabel="Duplicates resolved"
                      accessibilityValue={{
                        min: 0,
                        max: progress.total,
                        now: progress.resolved,
                      }}
                      className="h-1.5 overflow-hidden rounded-full bg-muted"
                    >
                      <View
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(progress.resolved / progress.total) * 100}%`,
                        }}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}
              <ConflictComparison
                conflict={conflict}
                variant={variant}
                combinedQuantity={combinedQuantity}
                mealName={scenario.mealName}
              />
              <View className="gap-3">
                {variant === 'compact' ? (
                  <View className="gap-2">
                    <Text className="text-sm font-semibold">
                      How should this item be added?
                    </Text>
                    <CompactChoiceSelector
                      choice={selectedChoice}
                      canIncrement={conflict.canIncrement}
                      disabled={closing}
                      onSelect={choice =>
                        setDraftChoices(choices =>
                          recordDecision(choices, conflict.id, choice)
                        )
                      }
                    />
                  </View>
                ) : null}
                {currentChoice && variant === 'detailed' ? (
                  <Text className="text-sm text-muted-foreground">
                    Your staged choice: {choiceLabel(currentChoice)}
                  </Text>
                ) : null}
                {progress.total > 1 ? (
                  <HapticPressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: applyRemaining }}
                    accessibilityLabel="Apply this choice to remaining items"
                    onPress={() => setApplyRemaining(value => !value)}
                    disabled={closing}
                    className={cn(
                      'min-h-12 flex-row items-center gap-3 rounded-xl p-3',
                      variant === 'detailed' && 'bg-muted'
                    )}
                  >
                    <View
                      className={cn(
                        'size-6 items-center justify-center rounded-md border border-border',
                        applyRemaining && 'bg-primary'
                      )}
                    >
                      {applyRemaining ? (
                        <Text className="font-semibold text-primary-foreground">
                          ✓
                        </Text>
                      ) : null}
                    </View>
                    <Text className="flex-1 text-sm">
                      Apply this choice to remaining items
                    </Text>
                  </HapticPressable>
                ) : null}
              </View>
            </>
          ) : confirmedPlan ? (
            <View className="gap-4">
              <Text className="text-xl font-semibold">
                Your choices are ready
              </Text>
              <Text>
                {confirmedPlan.increments.length} existing items would be
                incremented. {confirmedPlan.creates.length} separate items would
                be created.
              </Text>
              {confirmedPlan.increments.map(increment => {
                const target = scenario.existingItems.find(
                  item => item.id === increment.targetId
                );
                return (
                  <View
                    key={increment.targetId}
                    className="gap-1 rounded-xl bg-muted p-4"
                  >
                    <Text className="font-semibold">{target?.name}</Text>
                    <Text>
                      {quantityLabel(target?.quantity ?? 0, target?.unit ?? '')}{' '}
                      +{' '}
                      {quantityLabel(
                        increment.quantityDelta,
                        target?.unit ?? ''
                      )}{' '}
                      ={' '}
                      {quantityLabel(
                        (target?.quantity ?? 0) + increment.quantityDelta,
                        target?.unit ?? ''
                      )}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {increment.sources.length} meal contribution(s)
                    </Text>
                  </View>
                );
              })}
              {confirmedPlan.creates.map(item => (
                <Text key={item.sourceId}>
                  {item.name} · {quantityLabel(item.quantity, item.unit)} ·
                  Separate item
                </Text>
              ))}
            </View>
          ) : (
            <View className="gap-4">
              <Text className="text-xl font-semibold">
                {progress.total === 0
                  ? 'No duplicates to resolve'
                  : `${progress.resolved} of ${progress.total} resolved`}
              </Text>
              {progress.total > 0 ? (
                <Text className="text-muted-foreground">
                  {
                    Object.values(decisions).filter(
                      choice => choice === 'increment'
                    ).length
                  }{' '}
                  increment choices ·{' '}
                  {
                    Object.values(decisions).filter(
                      choice => choice === 'separate'
                    ).length
                  }{' '}
                  separate choices
                </Text>
              ) : null}
              {detection.conflicts.map((item, itemIndex) => (
                <HapticPressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.incoming.name}: ${choiceLabel(decisions[item.id])}`}
                  onPress={() => goTo(itemIndex)}
                  disabled={closing}
                  className="min-h-12 gap-1 rounded-xl bg-muted p-4"
                >
                  <Text className="font-semibold">{item.incoming.name}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {choiceLabel(decisions[item.id])} · Tap to edit
                  </Text>
                </HapticPressable>
              ))}
              {detection.nonConflicting.length > 0 ? (
                <View className="gap-2">
                  <Text className="font-semibold">
                    New items with no duplicates
                  </Text>
                  {detection.nonConflicting.map(item => (
                    <Text
                      key={item.sourceId}
                      className="text-sm text-muted-foreground"
                    >
                      {item.name} · {quantityLabel(item.quantity, item.unit)}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          )}
          {status ? (
            <Text
              accessibilityLiveRegion="polite"
              className="text-sm text-muted-foreground"
            >
              {status}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hidden: { display: 'none' },
  tabular: { fontVariant: ['tabular-nums'] },
});
