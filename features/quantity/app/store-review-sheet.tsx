import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Text } from '@/components/ui/text';
import { DuplicateOutcomeCards } from '@/features/meal-planner/components/duplicate-outcome-cards';

import { formatQuantity } from '../model';
import type { Destination } from '../shopping';
import type { StoreDecisions, StoreConflict } from '../store-conflicts';

import { registerStoreReviewer, type StoreReviewRequest } from './store-review';

type Pending = StoreReviewRequest & {
  requestId: number;
  resolve: (decisions: StoreDecisions) => void;
  reject: (error: Error) => void;
};

export function StoreReviewHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  const active = useRef<Pending | null>(null);
  const nextRequestId = useRef(0);
  useEffect(() => {
    const unregister = registerStoreReviewer(
      request =>
        new Promise((resolve, reject) => {
          if (active.current) {
            reject(new Error('Finish the current store review first.'));
            return;
          }
          const next = {
            ...request,
            resolve,
            reject,
            requestId: ++nextRequestId.current,
          };
          active.current = next;
          setPending(next);
        })
    );
    return () => {
      unregister();
      active.current?.reject(new Error('Addition cancelled'));
      active.current = null;
    };
  }, []);
  if (!pending) return null;
  return (
    <StoreReviewSheet
      key={pending.requestId}
      request={pending}
      onFinish={decisions => {
        active.current = null;
        setPending(null);
        if (decisions) pending.resolve(decisions);
        else pending.reject(new Error('Addition cancelled'));
      }}
    />
  );
}

function StoreReviewSheet({
  request,
  onFinish,
}: {
  request: StoreReviewRequest;
  onFinish: (decisions: StoreDecisions | null) => void;
}) {
  const sheet = useRef<TrueSheet>(null);
  const scroll = useRef<ScrollView>(null);
  const result = useRef<StoreDecisions | null>(null);
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState<number | null>(
    request.conflicts.length === 1 ? 0 : null
  );
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [footerHeight, setFooterHeight] = useState(160);
  useEffect(() => {
    void sheet.current?.present();
  }, []);
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
    setIndex(next);
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
    result.current = destinations;
    setClosing(true);
    void sheet.current?.dismiss();
  };
  const conflict = index === null ? null : request.conflicts[index];
  return (
    <BottomSheet
      ref={sheet}
      name="store-conflict-review"
      detents={[1]}
      scrollable
      viewClassName="flex-1"
      onStartClose={() => setClosing(true)}
      onDismiss={() => onFinish(result.current)}
      footer={
        <View
          className="gap-2 bg-background px-6 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
          onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}
        >
          {error ? (
            <Text accessibilityRole="alert" className="text-destructive">
              {error}
            </Text>
          ) : null}
          {index !== null && request.conflicts.length > 1 ? (
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                disabled={closing || index === 0}
                onPress={() => goTo(index - 1)}
              >
                <Text>Previous</Text>
              </Button>
              <Button
                className="flex-1"
                disabled={closing}
                onPress={() => goTo(null)}
              >
                <Text>Done</Text>
              </Button>
              <Button
                variant="outline"
                disabled={closing || index === request.conflicts.length - 1}
                onPress={() => goTo(index + 1)}
              >
                <Text>Next</Text>
              </Button>
            </View>
          ) : (
            <Button size="lg" disabled={closing} onPress={confirm}>
              <Text>Add to list</Text>
            </Button>
          )}
          <Button
            variant="ghost"
            disabled={closing}
            onPress={() => {
              setClosing(true);
              void sheet.current?.dismiss();
            }}
          >
            <Text>Cancel</Text>
          </Button>
        </View>
      }
    >
      <ScrollView
        ref={scroll}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: footerHeight + 24 }}
      >
        <View className="gap-5 px-6">
          <BottomSheet.Header
            title="Choose stores"
            description="These items are already on your list at a different store."
          />
          {request.changed ? (
            <Text accessibilityRole="alert">
              Your list changed. Review the updated items before adding.
            </Text>
          ) : null}
          {conflict ? (
            <>
              {request.conflicts.length > 1 ? (
                <HapticPressable
                  accessibilityRole="button"
                  disabled={closing}
                  onPress={() => goTo(null)}
                  className="min-h-12 justify-center"
                >
                  <Text>
                    All items · {(index ?? 0) + 1}/{request.conflicts.length}
                  </Text>
                </HapticPressable>
              ) : null}
              <Text className="text-xl font-semibold">
                {conflict.item.name}
              </Text>
              <Text className="text-muted-foreground">
                Adding {formatQuantity(conflict.item.quantity)}{' '}
                {conflict.item.unit} · {storeName(conflict.item.store)}
              </Text>
              {conflict.rows.map(({ row, quantity }) => (
                <Text key={row.id} className="text-muted-foreground">
                  On your list: {formatQuantity(quantity)} {row.unit} ·{' '}
                  {storeName(row.store)}
                </Text>
              ))}
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
            </>
          ) : (
            request.conflicts.map((item, itemIndex) => (
              <HapticPressable
                key={item.item.id}
                accessibilityRole="button"
                disabled={closing}
                onPress={() => goTo(itemIndex)}
                className="gap-2 rounded-2xl border border-border p-4"
              >
                <Text className="font-semibold">{item.item.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  {formatQuantity(item.item.quantity)} {item.item.unit} ·{' '}
                  {storeName(item.item.store)}
                </Text>
                <Text>{selectedOption(item).label}</Text>
              </HapticPressable>
            ))
          )}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
