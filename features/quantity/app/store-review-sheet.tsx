import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import type { ConflictIndexTreatment } from '@/components/conflict-review-row';

import type { StoreDecisions } from '../store-conflicts';
import { StoreReviewCancelledError } from '../store-review-cancelled';

import { registerStoreReviewer, type StoreReviewRequest } from './store-review';
import { StoreReviewContent } from './store-review-content';

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
      active.current?.reject(new StoreReviewCancelledError());
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
        else pending.reject(new StoreReviewCancelledError());
      }}
    />
  );
}

export function StoreReviewSheet({
  request,
  indexTreatment,
  onFinish,
}: {
  request: StoreReviewRequest;
  indexTreatment?: ConflictIndexTreatment;
  onFinish: (decisions: StoreDecisions | null) => void;
}) {
  const sheet = useRef<TrueSheet>(null);
  const result = useRef<StoreDecisions | null>(null);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentHeight = Math.min(height * 0.9, height - insets.top - 12);
  useEffect(() => {
    void sheet.current?.present();
  }, []);
  return (
    <BottomSheet
      ref={sheet}
      name="store-conflict-review"
      detents={[contentHeight / height]}
      insetAdjustment="never"
      scrollable
      viewClassName="flex-1"
      onDismiss={() => onFinish(result.current)}
    >
      <View style={{ height: contentHeight }}>
        <StoreReviewContent
          request={request}
          indexTreatment={indexTreatment}
          onBack={() => void sheet.current?.dismiss()}
          onFinish={decisions => {
            result.current = decisions;
            void sheet.current?.dismiss();
          }}
        />
      </View>
    </BottomSheet>
  );
}
