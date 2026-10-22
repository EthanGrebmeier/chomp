import { describe, expect, it } from 'vitest';

import {
  doesInstantAuthMatchClerk,
  getAuthReconciliationAction,
  shouldStartClerkSignOutGracePeriod,
} from '../auth-reconciliation';

const signedInInstantUser = {
  id: 'instant-user',
  email: 'person@example.com',
};

describe('auth reconciliation', () => {
  it('waits while Clerk or Instant is still restoring', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: false,
        isSignedIn: undefined,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: undefined,
        hasClerkSignOutGraceElapsed: false,
        hasClerkRestoreTimedOut: false,
      })
    ).toBe('wait');
  });

  it('falls back to the cached Instant session once Clerk restore times out', () => {
    const baseArgs = {
      isClerkLoaded: false,
      isSignedIn: undefined,
      clerkUserId: null,
      clerkEmail: null,
      hasClerkSignOutGraceElapsed: false,
      hasClerkRestoreTimedOut: true,
    };

    expect(
      getAuthReconciliationAction({
        ...baseArgs,
        instantAuth: signedInInstantUser,
      })
    ).toBe('use-cached-instant-session');
    expect(
      getAuthReconciliationAction({
        ...baseArgs,
        instantAuth: { id: 'guest-user' },
      })
    ).toBe('use-cached-instant-session');
    expect(
      getAuthReconciliationAction({ ...baseArgs, instantAuth: null })
    ).toBe('use-cached-instant-session');
    expect(
      getAuthReconciliationAction({
        ...baseArgs,
        isClerkLoaded: true,
        instantAuth: signedInInstantUser,
      })
    ).toBe('use-cached-instant-session');
  });

  it('still waits for Instant storage even after Clerk restore times out', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: false,
        isSignedIn: undefined,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: undefined,
        hasClerkSignOutGraceElapsed: false,
        hasClerkRestoreTimedOut: true,
      })
    ).toBe('wait');
  });

  it('keeps an existing Instant session while the Clerk session is pending', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: undefined,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: signedInInstantUser,
        hasClerkSignOutGraceElapsed: false,
        hasClerkRestoreTimedOut: false,
      })
    ).toBe('wait');
  });

  it('keeps a matching Instant session without refreshing a Clerk token', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: true,
        clerkUserId: 'clerk-user',
        clerkEmail: 'PERSON@example.com',
        instantAuth: signedInInstantUser,
        hasClerkSignOutGraceElapsed: false,
        hasClerkRestoreTimedOut: false,
      })
    ).toBe('keep-email-session');
  });

  it('matches users by id when email is not ready', () => {
    expect(
      doesInstantAuthMatchClerk({
        clerkUserId: 'clerk-user',
        clerkEmail: null,
        instantAuth: { id: 'clerk-user', email: 'person@example.com' },
      })
    ).toBe(true);
  });

  it('bridges when Clerk is signed in but Instant is missing or belongs to another user', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: true,
        clerkUserId: 'clerk-user',
        clerkEmail: 'person@example.com',
        instantAuth: null,
        hasClerkSignOutGraceElapsed: false,
        hasClerkRestoreTimedOut: false,
      })
    ).toBe('bridge-clerk-session');

    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: true,
        clerkUserId: 'clerk-user',
        clerkEmail: 'person@example.com',
        instantAuth: {
          id: 'other-user',
          email: 'other@example.com',
        },
        hasClerkSignOutGraceElapsed: false,
        hasClerkRestoreTimedOut: false,
      })
    ).toBe('bridge-clerk-session');
  });

  it('preserves the Instant session during a transient Clerk sign-out', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: false,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: signedInInstantUser,
        hasClerkSignOutGraceElapsed: false,
        hasClerkRestoreTimedOut: false,
      })
    ).toBe('defer-instant-sign-out');
  });

  it('clears the stale Instant email session after the sign-out grace period', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: false,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: signedInInstantUser,
        hasClerkSignOutGraceElapsed: true,
        hasClerkRestoreTimedOut: false,
      })
    ).toBe('clear-instant-session');
  });

  it('only starts the sign-out grace period while online', () => {
    expect(
      shouldStartClerkSignOutGracePeriod({
        isClerkLoaded: true,
        isSignedIn: false,
        isOffline: true,
      })
    ).toBe(false);

    expect(
      shouldStartClerkSignOutGracePeriod({
        isClerkLoaded: true,
        isSignedIn: false,
        isOffline: false,
      })
    ).toBe(true);
  });

  it('restores guests and recognizes a fully signed-out state', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: false,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: { id: 'guest-user' },
        hasClerkSignOutGraceElapsed: false,
        hasClerkRestoreTimedOut: false,
      })
    ).toBe('keep-guest-session');

    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: false,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: null,
        hasClerkSignOutGraceElapsed: false,
        hasClerkRestoreTimedOut: false,
      })
    ).toBe('signed-out');
  });
});
