export type EntryScreen = 'grocery' | 'shopping';

export type AppEntryState = {
  userId: string | undefined;
  ready: boolean;
  readyScreen?: EntryScreen;
  revealed: boolean;
  painted: boolean;
};

/** A reveal belongs to one authenticated session, never to the previous account. */
export function reconcileAppEntry(
  state: AppEntryState,
  userId: string | undefined,
  canReveal: boolean,
  screen: EntryScreen = 'grocery'
): AppEntryState {
  if (state.userId !== userId)
    return { userId, ready: false, revealed: false, painted: false };
  if (
    userId &&
    canReveal &&
    state.ready &&
    state.readyScreen === screen &&
    !state.revealed
  )
    return { ...state, revealed: true };
  return state;
}

export function reportAppEntryReady(
  state: AppEntryState,
  userId: string | undefined,
  ready: boolean,
  screen: EntryScreen = 'grocery'
): AppEntryState {
  // Old accounts cannot report, and an outgoing screen cannot clear its replacement.
  if (state.userId !== userId || (!ready && state.readyScreen !== screen))
    return state;
  return state.ready === ready && state.readyScreen === screen
    ? state
    : { ...state, ready, readyScreen: screen };
}
