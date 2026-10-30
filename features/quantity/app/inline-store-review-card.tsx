import { SheetScreenOverlay } from '@/components/sheet-screen-overlay';

import { StoreReviewContent } from './store-review-content';
import type { useInlineStoreReview } from './use-inline-store-review';

export function InlineStoreReviewCard({
  review,
}: {
  review: ReturnType<typeof useInlineStoreReview>;
}) {
  const pending = review.pending;
  if (!pending) return null;
  return (
    <SheetScreenOverlay key={pending.id}>
      <StoreReviewContent
        request={pending.request}
        onBack={() => review.finish(null, pending.id)}
        onFinish={decisions => review.finish(decisions, pending.id)}
      />
    </SheetScreenOverlay>
  );
}
