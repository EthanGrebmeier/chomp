import { Activity, startTransition, useEffect, useState } from 'react';

import {
  useAppEntryVisible,
  useSplashDismissed,
} from '@/lib/startup-screen-ready';

import { useUserMealPlanData } from '../hooks/useUserMealPlanData';
import type { MealPlanFocusRequest } from '../types';

import { MealPlanner } from './index';

type Props = {
  listId: string;
  isActive: boolean;
  isListReady: boolean;
  focusRequest: MealPlanFocusRequest | null;
};

/** Own preload state locally so warming the planner never rerenders the list. */
export function PreloadedMealPlanner({
  listId,
  isActive,
  isListReady,
  focusRequest,
}: Props) {
  const splashDismissed = useSplashDismissed();
  const entryVisible = useAppEntryVisible();
  const [preloaded, setPreloaded] = useState(false);
  // An explicit open retains the prepared screen even if it beats idle preload.
  if (isActive && !preloaded) setPreloaded(true);
  useEffect(() => {
    if (
      !entryVisible ||
      !splashDismissed ||
      !isListReady ||
      preloaded ||
      isActive
    )
      return;
    const idle = requestIdleCallback(() => {
      startTransition(() => setPreloaded(true));
    });
    return () => cancelIdleCallback(idle);
  }, [entryVisible, splashDismissed, isListReady, preloaded, isActive]);

  if (!preloaded && !isActive) return null;
  return (
    <WarmMealPlanner
      listId={listId}
      isActive={isActive}
      focusRequest={focusRequest}
    />
  );
}

function WarmMealPlanner({
  listId,
  isActive,
  focusRequest,
}: Omit<Props, 'isListReady'>) {
  // Activity suspends effects while hidden. Keep the data subscription warm
  // outside it so opening the prepared calendar never starts a new query.
  useUserMealPlanData(listId);
  return (
    <Activity mode={isActive ? 'visible' : 'hidden'}>
      <MealPlanner
        listId={listId}
        showHeader={false}
        isActive={isActive}
        focusRequest={focusRequest}
      />
    </Activity>
  );
}
