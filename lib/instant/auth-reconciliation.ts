export type AuthIdentity = {
  id: string;
  email?: string | null;
};

export type AuthReconciliationAction =
  | 'wait'
  | 'keep-email-session'
  | 'keep-guest-session'
  | 'bridge-clerk-session'
  | 'clear-instant-session'
  | 'signed-out';

type GetAuthReconciliationActionArgs = {
  isClerkLoaded: boolean;
  isSignedIn: boolean | undefined;
  clerkUserId: string | null;
  clerkEmail: string | null;
  instantAuth: AuthIdentity | null | undefined;
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

export const getAuthReconciliationAction = ({
  isClerkLoaded,
  isSignedIn,
  clerkUserId,
  clerkEmail,
  instantAuth,
}: GetAuthReconciliationActionArgs): AuthReconciliationAction => {
  if (!isClerkLoaded || isSignedIn === undefined || instantAuth === undefined) {
    return 'wait';
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
    return 'clear-instant-session';
  }

  if (instantAuth) {
    return 'keep-guest-session';
  }

  return 'signed-out';
};
