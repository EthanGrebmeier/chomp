import { useIsFocused } from 'expo-router';
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react';

import type { EntryScreen } from './app-entry';
import { scheduleAfterPaint } from './schedule-after-paint';

export const StartupScreenReadyContext = createContext<
  (ready: boolean, screen: EntryScreen) => void
>(() => {});

/** Report data and edit readiness before exposing the initial grocery screen. */
export function useStartupScreenReady(
  ready: boolean,
  screen: EntryScreen = 'grocery'
) {
  const focused = useIsFocused();
  const report = useContext(StartupScreenReadyContext);
  useEffect(() => {
    if (!focused) return;
    report(false, screen);
    const cancel = ready
      ? scheduleAfterPaint(() => report(true, screen))
      : undefined;
    return () => {
      cancel?.();
      report(false, screen);
    };
  }, [focused, ready, report, screen]);
}

// Native splash visibility is a process-wide, one-way transition. Publishing it
// here avoids rerendering the whole navigator at the first interactive frame.
let splashDismissed = false;
const splashListeners = new Set<() => void>();
const subscribeToSplash = (listener: () => void) => {
  splashListeners.add(listener);
  return () => {
    splashListeners.delete(listener);
  };
};
export function markSplashDismissed() {
  if (splashDismissed) return;
  splashDismissed = true;
  splashListeners.forEach(listener => listener());
}
export function useSplashDismissed() {
  return useSyncExternalStore(
    subscribeToSplash,
    () => splashDismissed,
    () => false
  );
}

export const AppEntryVisibleContext = createContext(false);
export const useAppEntryVisible = () => useContext(AppEntryVisibleContext);
