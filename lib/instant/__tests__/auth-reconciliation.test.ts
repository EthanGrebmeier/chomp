import { describe, expect, it } from 'vitest';

import {
  doesInstantAuthMatchClerk,
  getAuthReconciliationAction,
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

        hasClerkRestoreTimedOut: false,
      })
    ).toBe('defer-instant-sign-out');
  });

  it('preserves cached email auth when Clerk reports signed out after a failed refresh', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: false,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: signedInInstantUser,

        hasClerkRestoreTimedOut: false,
      })
    ).toBe('defer-instant-sign-out');
  });

  it('restores guests and recognizes a fully signed-out state', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: false,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: { id: 'guest-user' },

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

        hasClerkRestoreTimedOut: false,
      })
    ).toBe('signed-out');
  });
});
