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
      })
    ).toBe('bridge-clerk-session');
  });

  it('clears only the stale Instant email session after Clerk confirms sign-out', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: false,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: signedInInstantUser,
      })
    ).toBe('clear-instant-session');
  });

  it('restores guests and recognizes a fully signed-out state', () => {
    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: false,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: { id: 'guest-user' },
      })
    ).toBe('keep-guest-session');

    expect(
      getAuthReconciliationAction({
        isClerkLoaded: true,
        isSignedIn: false,
        clerkUserId: null,
        clerkEmail: null,
        instantAuth: null,
      })
    ).toBe('signed-out');
  });
});
