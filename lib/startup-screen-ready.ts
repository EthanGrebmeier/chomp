import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react';

export const StartupScreenReadyContext = createContext<
  (ready: boolean) => void
>(() => {});

/** Report data and edit readiness before exposing the initial grocery screen. */
export function useStartupScreenReady(ready: boolean) {
  const report = useContext(StartupScreenReadyContext);
  useEffect(() => {
    report(ready);
    return () => report(false);
  }, [ready, report]);
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
