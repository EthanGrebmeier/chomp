const productionApps = new Set([
  '5df33e29-252b-4e1c-a111-53787beccba3',
  'b9d047cb-bb6f-4b36-95af-a6a1d045846b',
]);

export function assertTestTarget(env) {
  const appId = env.INSTANT_TEST_APP_ID;
  if (
    !appId ||
    productionApps.has(appId.trim().toLowerCase()) ||
    env.EXPO_PUBLIC_INSTANT_APP_ID !== appId ||
    !env.INSTANT_APP_ADMIN_TOKEN
  ) {
    throw new Error(
      'SDK tests require a separate INSTANT_TEST_APP_ID matching EXPO_PUBLIC_INSTANT_APP_ID and its admin token. Current and former production apps are forbidden.'
    );
  }
  return appId;
}
