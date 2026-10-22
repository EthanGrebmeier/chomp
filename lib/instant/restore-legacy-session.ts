/** Read the legacy session directly, never initialize its SDK or replay its queue. */
export const LEGACY_SESSION_KEY =
  'instant_b9d047cb-bb6f-4b36-95af-a6a1d045846b_5_kv_currentUser';
const MIGRATION_KEY = 'chomp:quantity:session-migrated:v1';
type Session = { id: string; email?: string | null; refresh_token?: string };
type Dependencies = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  getAuth: () => Promise<Session | null | undefined>;
  signInWithToken: (token: string) => Promise<{ user: Session }>;
  signOut: () => Promise<unknown>;
};
export async function restoreLegacySession(deps: Dependencies) {
  if (await deps.getItem(MIGRATION_KEY)) return;
  if (await deps.getAuth()) {
    await deps.setItem(MIGRATION_KEY, '1');
    return;
  }
  const raw = await deps.getItem(LEGACY_SESSION_KEY);
  if (!raw) {
    await deps.setItem(MIGRATION_KEY, '1');
    return;
  }
  let legacy: unknown = JSON.parse(raw);
  // SDK storage versions can contain a JSON string inside the JSON value.
  if (typeof legacy === 'string') legacy = JSON.parse(legacy);
  if (legacy === null) {
    await deps.setItem(MIGRATION_KEY, '1');
    return;
  }
  if (
    typeof legacy !== 'object' ||
    !('id' in legacy) ||
    !('refresh_token' in legacy) ||
    typeof legacy.id !== 'string' ||
    typeof legacy.refresh_token !== 'string'
  )
    throw Error('Legacy session is incomplete');
  const { user } = await deps.signInWithToken(legacy.refresh_token);
  const email =
    'email' in legacy && typeof legacy.email === 'string' ? legacy.email : null;
  if (
    user.id !== legacy.id &&
    (!email || email.toLowerCase() !== user.email?.toLowerCase())
  ) {
    await deps.signOut();
    throw Error('Restored session identity differs');
  }
  await deps.setItem(MIGRATION_KEY, '1');
}
