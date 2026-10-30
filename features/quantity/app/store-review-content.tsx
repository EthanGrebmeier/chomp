import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import {
  ConflictReviewRow,
  type ConflictIndexTreatment,
} from '@/components/conflict-review-row';
import { SheetFooter } from '@/components/sheet-content';
import { SheetPage } from '@/components/sheet-page';
import { BottomActionButton } from '@/components/ui/bottom-action-button';
import { Button } from '@/components/ui/button';
import { CloseButton } from '@/components/ui/close-button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DuplicateOutcomeCards } from '@/features/meal-planner/components/duplicate-outcome-cards';

import { formatQuantity } from '../model';
import type { Destination } from '../shopping';
import type { StoreDecisions, StoreConflict } from '../store-conflicts';

import { ConflictReviewPage } from './conflict-review-page';
import type { StoreReviewRequest } from './store-review';

export function StoreReviewContent({
  indexTreatment = 'navigation',
  request,
  onFinish,
  onBack,
}: {
  request: StoreReviewRequest;
  indexTreatment?: ConflictIndexTreatment;
  onFinish: (decisions: StoreDecisions) => void;
  onBack: () => void;
}) {
  const scroll = useRef<ScrollView>(null);
  const [navigation, setNavigation] = useState<{
    index: number | null;
    outgoing: { index: number | null } | null;
    direction: number;
    revision: number;
  }>({
    index: request.conflicts.length === 1 ? 0 : null,
    outgoing: null,
    direction: 1,
    revision: 0,
  });
  const { index } = navigation;
  const finishPageExit = useCallback((revision: number) => {
    setNavigation(current =>
      current.revision === revision ? { ...current, outgoing: null } : current
    );
  }, []);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storeName = (store: string) =>
    store ? (request.stores[store] ?? 'Unknown store') : 'No store';
  const optionsFor = (
    conflict: StoreConflict
  ): {
    id: string;
    label: string;
    description: string;
    destination: Destination;
  }[] => [
    {
      id: 'separate',
      label: 'Keep separate',
      description: `Add ${formatQuantity(conflict.item.quantity)} ${conflict.item.unit} · ${storeName(conflict.item.store)}`,
      destination: {},
    },
    ...conflict.rows.flatMap(({ row, quantity }) =>
      [row.store, conflict.item.store].map(store => ({
        id: JSON.stringify([row.id, store]),
        label: store
          ? `Combine at ${storeName(store)}`
          : 'Combine without a store',
        description: `${formatQuantity(quantity)} + ${formatQuantity(conflict.item.quantity)} = ${formatQuantity(quantity + conflict.item.quantity)} ${row.unit} · ${storeName(store)}`,
        destination: { rowId: row.id, store },
      }))
    ),
  ];
  const selectedOption = (conflict: StoreConflict) =>
    optionsFor(conflict).find(
      option => option.id === choices[conflict.item.id]
    ) ?? optionsFor(conflict)[0];
  const goTo = (next: number | null) => {
    if (next === index || closing) return;
    setNavigation(current => ({
      index: next,
      outgoing: { index: current.index },
      direction: (next ?? -1) > (current.index ?? -1) ? 1 : -1,
      revision: current.revision + 1,
    }));
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const confirm = () => {
    const destinations: StoreDecisions = {};
    const stores = new Map<string, string | undefined>();
    for (const conflict of request.conflicts) {
      const destination = selectedOption(conflict).destination;
      if ('rowId' in destination && destination.rowId) {
        if (
          stores.has(destination.rowId) &&
          stores.get(destination.rowId) !== destination.store
        ) {
          setError(
            'Items combined into the same row need the same store. Review your choices.'
          );
          return;
        }
        stores.set(destination.rowId, destination.store);
      }
      destinations[conflict.item.id] = destination;
    }
    setClosing(true);
    onFinish(destinations);
  };
  const renderPage = (index: number | null) => {
    const conflict = index === null ? null : request.conflicts[index];
    return (
      <>
        {request.changed ? (
          <Text accessibilityRole="alert">
            Your list changed. Review the updated items before adding.
          </Text>
        ) : null}
        {conflict ? (
          <>
            <View className="gap-4">
              {request.conflicts.length === 1 ? (
                <Text
                  accessibilityRole="header"
                  className="text-2xl font-semibold"
                >
                  {conflict.item.name}
                </Text>
              ) : null}
              <View className="gap-3 rounded-2xl bg-muted p-4">
                {[
                  ...conflict.rows.map(({ row, quantity }) => ({
                    id: row.id,
                    label: 'On your list',
                    quantity,
                    unit: row.unit,
                    store: row.store,
                  })),
                  {
                    id: 'incoming',
                    label: 'Adding',
                    quantity: conflict.item.quantity,
                    unit: conflict.item.unit,
                    store: conflict.item.store,
                  },
                ].map(item => (
                  <View key={item.id} className="gap-1">
                    <View className="flex-row flex-wrap justify-between gap-2">
                      <Text className="text-muted-foreground">
                        {item.label}
                      </Text>
                      <Text
                        className="font-semibold"
                        style={{ fontVariant: ['tabular-nums'] }}
                      >
                        {formatQuantity(item.quantity)} {item.unit}
                      </Text>
                    </View>
                    <Text className="text-sm text-muted-foreground">
                      {storeName(item.store)}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className="text-sm text-muted-foreground">
                These quantities can be added together. Choose a store for the
                combined item, or keep them separate.
              </Text>
            </View>
            <View className="gap-3">
              <Text className="text-sm font-semibold">
                How should this item be added?
              </Text>
              <DuplicateOutcomeCards
                options={optionsFor(conflict)}
                choice={selectedOption(conflict).id}
                disabled={closing}
                onSelect={choice => {
                  setChoices(current => ({
                    ...current,
                    [conflict.item.id]: choice,
                  }));
                  setError(null);
                }}
              />
            </View>
          </>
        ) : (
          request.conflicts.map((item, itemIndex) => (
            <ConflictReviewRow
              key={item.item.id}
              treatment={indexTreatment}
              name={item.item.name}
              detail="Already on your list at a different store."
              summary={selectedOption(item).label}
              accessibilitySummary={`Already on your list at a different store. ${selectedOption(item).description}`}
              differences={['Different stores']}
              disabled={closing}
              onPress={() => goTo(itemIndex)}
            />
          ))
        )}
      </>
    );
  };
  return (
    <SheetPage
      header={{
        title:
          index !== null && request.conflicts.length > 1
            ? request.conflicts[index].item.name
            : `${request.conflicts.length} ${request.conflicts.length === 1 ? 'Conflict' : 'Conflicts'} Detected`,
        subtitle:
          index !== null && request.conflicts.length > 1
            ? `Item ${index + 1} of ${request.conflicts.length}`
            : request.conflicts.length === 1
              ? 'This item is already on your list. How would you like to handle it?'
              : 'How would you like to handle them?',
        backAction: (
          <CloseButton
            disabled={closing}
            accessibilityLabel={
              index !== null && request.conflicts.length > 1
                ? 'Back to all items'
                : 'Back to adding items'
            }
            onPress={() =>
              index !== null && request.conflicts.length > 1
                ? goTo(null)
                : onBack()
            }
          />
        ),
      }}
    >
      <ScrollView
        ref={scroll}
        className="min-h-0 flex-1"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={{ overflow: 'hidden' }}>
          {[
            ...(navigation.outgoing ? [navigation.outgoing.index] : []),
            index,
          ].map(pageIndex => (
            <ConflictReviewPage
              key={pageIndex ?? 'overview'}
              active={pageIndex === index}
              direction={navigation.direction}
              revision={navigation.revision}
              onExited={finishPageExit}
            >
              {renderPage(pageIndex)}
            </ConflictReviewPage>
          ))}
        </View>
      </ScrollView>
      <SheetFooter className="gap-2 bg-background">
        {error ? (
          <Text accessibilityRole="alert" className="text-destructive">
            {error}
          </Text>
        ) : null}
        {index !== null && request.conflicts.length > 1 ? (
          <View key="detail-footer" className="flex-row items-center gap-2">
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
            <BottomActionButton
              className="flex-1"
              accessibilityLabel="Done, back to all items"
              disabled={closing}
              onPress={() => goTo(null)}
            >
              <Text>Done</Text>
            </BottomActionButton>
            {index < request.conflicts.length - 1 ? (
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
          <BottomActionButton
            key="confirm-footer"
            disabled={closing}
            onPress={confirm}
          >
            <Text>Add to list</Text>
          </BottomActionButton>
        )}
      </SheetFooter>
    </SheetPage>
  );
}
