export type AuthIdentity = {
  id: string;
  email?: string | null;
};

export type AuthReconciliationAction =
  | 'wait'
  | 'keep-email-session'
  | 'keep-guest-session'
  | 'defer-instant-sign-out'
  | 'use-cached-instant-session'
  | 'bridge-clerk-session'
  | 'clear-instant-session'
  | 'signed-out';

type GetAuthReconciliationActionArgs = {
  isClerkLoaded: boolean;
  isSignedIn: boolean | undefined;
  clerkUserId: string | null;
  clerkEmail: string | null;
  instantAuth: AuthIdentity | null | undefined;
  hasClerkSignOutGraceElapsed: boolean;
  /**
   * Clerk restores its session over the network. On a weak connection that
   * request can hang for a long time, so once this is true we stop waiting and
   * trust the locally persisted Instant session until Clerk catches up.
   */
  hasClerkRestoreTimedOut: boolean;
};

type ShouldStartClerkSignOutGracePeriodArgs = Pick<
  GetAuthReconciliationActionArgs,
  'isClerkLoaded' | 'isSignedIn'
> & {
  isOffline: boolean;
};

const normalizeEmail = (email: string | null | undefined) =>
  email?.trim().toLowerCase() ?? null;

export const doesInstantAuthMatchClerk = ({
  clerkEmail,
  clerkUserId,
  instantAuth,
}: Pick<
  GetAuthReconciliationActionArgs,
  'clerkEmail' | 'clerkUserId' | 'instantAuth'
>) => {
  if (!instantAuth) {
    return false;
  }

  if (clerkUserId && instantAuth.id === clerkUserId) {
    return true;
  }

  const normalizedClerkEmail = normalizeEmail(clerkEmail);
  const normalizedInstantEmail = normalizeEmail(instantAuth.email);

  return Boolean(
    normalizedClerkEmail &&
    normalizedInstantEmail &&
    normalizedClerkEmail === normalizedInstantEmail
  );
};

export const shouldStartClerkSignOutGracePeriod = ({
  isClerkLoaded,
  isSignedIn,
  isOffline,
}: ShouldStartClerkSignOutGracePeriodArgs) =>
  isClerkLoaded && isSignedIn === false && !isOffline;

export const getAuthReconciliationAction = ({
  isClerkLoaded,
  isSignedIn,
  clerkUserId,
  clerkEmail,
  instantAuth,
  hasClerkSignOutGraceElapsed,
  hasClerkRestoreTimedOut,
}: GetAuthReconciliationActionArgs): AuthReconciliationAction => {
  if (instantAuth === undefined) {
    return 'wait';
  }

  if (!isClerkLoaded || isSignedIn === undefined) {
    return hasClerkRestoreTimedOut ? 'use-cached-instant-session' : 'wait';
  }

  if (isSignedIn) {
    if (!clerkUserId && !clerkEmail) {
      return 'wait';
    }

    if (
      instantAuth?.email &&
      doesInstantAuthMatchClerk({
        clerkEmail,
        clerkUserId,
        instantAuth,
      })
    ) {
      return 'keep-email-session';
    }

    return 'bridge-clerk-session';
  }

  if (instantAuth?.email) {
    return hasClerkSignOutGraceElapsed
      ? 'clear-instant-session'
      : 'defer-instant-sign-out';
  }

  if (instantAuth) {
    return 'keep-guest-session';
  }

  return 'signed-out';
};
