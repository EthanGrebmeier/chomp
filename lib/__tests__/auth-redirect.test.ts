import type { Href } from 'expo-router';
import { describe, expect, it, vi } from 'vitest';

import { redirectSignedOutAuth } from '../instant/auth-redirect';

const authWelcomeRoute = '/(auth)' as Href;
const authExpiredRoute = '/(auth)/sign-in' as Href;

const createRouter = (canDismiss: boolean) => ({
  canDismiss: vi.fn(() => canDismiss),
  dismissAll: vi.fn(),
  replace: vi.fn(),
});

describe('redirectSignedOutAuth', () => {
  it('queues the expired-session route and dismisses active stacks', () => {
    const router = createRouter(true);
    const pendingTargetRef = { current: null as Href | null };

    const result = redirectSignedOutAuth({
      isOnAuthRoute: false,
      pendingTargetRef,
      router,
      target: authExpiredRoute,
    });

    expect(result).toBe('dismissed');
    expect(pendingTargetRef.current).toBe(authExpiredRoute);
    expect(router.dismissAll).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('queues the welcome route and dismisses active stacks for ordinary signed-out state', () => {
    const router = createRouter(true);
    const pendingTargetRef = { current: null as Href | null };

    const result = redirectSignedOutAuth({
      isOnAuthRoute: false,
      pendingTargetRef,
      router,
      target: authWelcomeRoute,
    });

    expect(result).toBe('dismissed');
    expect(pendingTargetRef.current).toBe(authWelcomeRoute);
    expect(router.dismissAll).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replaces immediately when there is no dismissible stack', () => {
    const router = createRouter(false);
    const pendingTargetRef = { current: null as Href | null };

    const result = redirectSignedOutAuth({
      isOnAuthRoute: false,
      pendingTargetRef,
      router,
      target: authWelcomeRoute,
    });

    expect(result).toBe('replaced');
    expect(pendingTargetRef.current).toBeNull();
    expect(router.dismissAll).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(authWelcomeRoute);
  });

  it('preserves a queued expired-session target after the dismiss completes', () => {
    const router = createRouter(false);
    const pendingTargetRef = { current: authExpiredRoute as Href | null };

    const result = redirectSignedOutAuth({
      isOnAuthRoute: false,
      pendingTargetRef,
      router,
      target: authWelcomeRoute,
    });

    expect(result).toBe('replaced');
    expect(pendingTargetRef.current).toBeNull();
    expect(router.replace).toHaveBeenCalledWith(authExpiredRoute);
  });

  it('clears pending redirects without navigating on auth routes', () => {
    const router = createRouter(true);
    const pendingTargetRef = { current: authExpiredRoute as Href | null };

    const result = redirectSignedOutAuth({
      isOnAuthRoute: true,
      pendingTargetRef,
      router,
      target: authWelcomeRoute,
    });

    expect(result).toBe('skipped');
    expect(pendingTargetRef.current).toBeNull();
    expect(router.dismissAll).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
