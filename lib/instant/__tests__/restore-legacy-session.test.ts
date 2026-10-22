import { expect, it, vi } from 'vitest';
import {
  LEGACY_SESSION_KEY,
  restoreLegacySession,
} from '../restore-legacy-session';
const fixture = () => ({
  getItem: vi.fn(async (key: string) =>
    key === LEGACY_SESSION_KEY
      ? JSON.stringify({ id: 'guest', refresh_token: 'private-token' })
      : null
  ),
  setItem: vi.fn(async () => {}),
  signOut: vi.fn(async () => {}),
  getAuth: vi.fn(async () => null),
  signInWithToken: vi.fn(async () => ({ user: { id: 'guest' } })),
});
it('restores the same guest without touching the old queue or creating a guest', async () => {
  const deps = fixture();
  await restoreLegacySession(deps);
  expect(deps.signInWithToken).toHaveBeenCalledWith('private-token');
  expect(deps.getItem.mock.calls.map(([key]) => key)).toEqual([
    'chomp:quantity:session-migrated:v1',
    LEGACY_SESSION_KEY,
  ]);
  expect(deps.setItem).toHaveBeenCalledTimes(1);
});
it('does not mark a failed session as migrated', async () => {
  const deps = fixture();
  deps.signInWithToken.mockRejectedValue(Error('offline'));
  await expect(restoreLegacySession(deps)).rejects.toThrow('offline');
  expect(deps.setItem).not.toHaveBeenCalled();
});
it('does not replace an existing destination session', async () => {
  const deps = fixture();
  deps.getAuth.mockResolvedValue({ id: 'current' } as never);
  await restoreLegacySession(deps);
  expect(deps.signInWithToken).not.toHaveBeenCalled();
});
it('rejects an unexpected guest identity', async () => {
  const deps = fixture();
  deps.signInWithToken.mockResolvedValue({ user: { id: 'wrong' } });
  await expect(restoreLegacySession(deps)).rejects.toThrow('identity differs');
  expect(deps.setItem).not.toHaveBeenCalled();
});
