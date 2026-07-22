import { describe, expect, it, vi } from 'vitest';

import { createInstantAuthBridge, InstantBridgeError } from '../auth-bridge';

describe('Instant auth bridge', () => {
  it('retries transient network failures without clearing either session', async () => {
    const signInWithIdToken = vi
      .fn<(token: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValue(undefined);
    const sleep = vi.fn(async () => undefined);
    const bridge = createInstantAuthBridge({
      signInWithIdToken,
      retryBaseDelayMs: 10,
      sleep,
    });
    const getToken = vi.fn(async () => 'clerk-token');

    await expect(bridge(getToken)).resolves.toBeUndefined();

    expect(getToken).toHaveBeenCalledTimes(3);
    expect(signInWithIdToken).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 10);
    expect(sleep).toHaveBeenNthCalledWith(2, 20);
  });

  it('shares one in-flight bridge across concurrent callers', async () => {
    let finishSignIn!: () => void;
    const signInWithIdToken = vi.fn(
      () =>
        new Promise<void>(resolve => {
          finishSignIn = resolve;
        })
    );
    const bridge = createInstantAuthBridge({ signInWithIdToken });
    const getToken = vi.fn(async () => 'clerk-token');

    const firstBridge = bridge(getToken);
    const secondBridge = bridge(getToken);

    expect(secondBridge).toBe(firstBridge);
    await vi.waitFor(() => {
      expect(signInWithIdToken).toHaveBeenCalledOnce();
    });

    finishSignIn();
    await expect(firstBridge).resolves.toBeUndefined();
    expect(getToken).toHaveBeenCalledOnce();
    expect(signInWithIdToken).toHaveBeenCalledOnce();
  });

  it('reports a missing Clerk token without attempting Instant sign-in', async () => {
    const signInWithIdToken = vi.fn(async () => undefined);
    const bridge = createInstantAuthBridge({ signInWithIdToken });

    await expect(bridge(async () => null)).rejects.toMatchObject<
      Partial<InstantBridgeError>
    >({
      name: 'InstantBridgeError',
      isTimeout: false,
    });
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });
});
