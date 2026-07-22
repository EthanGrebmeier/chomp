import type { Href } from 'expo-router';
import { describe, expect, it, vi } from 'vitest';

import { redirectSignedOutAuth } from '../instant/auth-redirect';

const authWelcomeRoute = '/(auth)' as Href;
const authExpiredRoute = authWelcomeRoute;

const createRouter = (canDismiss: boolean) => ({
  canDismiss: vi.fn(() => canDismiss),
  dismissTo: vi.fn(),
  replace: vi.fn(),
});

describe('redirectSignedOutAuth', () => {
  it('dismisses active stacks and immediately replaces with the expired-session route', () => {
    const router = createRouter(true);

    const result = redirectSignedOutAuth({
      isOnAuthRoute: false,
      router,
      target: authExpiredRoute,
    });

    expect(result).toBe('dismissed');
    expect(router.dismissTo).toHaveBeenCalledWith(authExpiredRoute);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('dismisses active stacks and immediately replaces with the welcome route', () => {
    const router = createRouter(true);

    const result = redirectSignedOutAuth({
      isOnAuthRoute: false,
      router,
      target: authWelcomeRoute,
    });

    expect(result).toBe('dismissed');
    expect(router.dismissTo).toHaveBeenCalledWith(authWelcomeRoute);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replaces immediately when there is no dismissible stack', () => {
    const router = createRouter(false);

    const result = redirectSignedOutAuth({
      isOnAuthRoute: false,
      router,
      target: authWelcomeRoute,
    });

    expect(result).toBe('replaced');
    expect(router.dismissTo).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(authWelcomeRoute);
  });

  it('does not navigate when already on an auth route', () => {
    const router = createRouter(true);

    const result = redirectSignedOutAuth({
      isOnAuthRoute: true,
      router,
      target: authWelcomeRoute,
    });

    expect(result).toBe('skipped');
    expect(router.dismissTo).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
