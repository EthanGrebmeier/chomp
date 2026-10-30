import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { Keyboard } from 'react-native';

import { createStoreReviewController } from './store-review-controller';

export function useInlineStoreReview(enabled: boolean) {
  // Reopening a sheet creates a new session. Late requests from an old add
  // retain its closed controller and cannot appear in the reopened sheet.
  const controller = useMemo(
    () => createStoreReviewController(enabled),
    [enabled]
  );
  const pending = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot
  );
  useLayoutEffect(() => {
    if (enabled) controller.open();
    return controller.close;
  }, [controller, enabled]);
  useEffect(() => {
    if (pending) Keyboard.dismiss();
  }, [pending]);
  return { ...controller, pending };
}
