/** The temporary release destination is isolated from legacy production writers. */
export const QUANTITY_TEST_APP = '5df33e29-252b-4e1c-a111-53787beccba3';
export const quantityWorkspaceAvailable = () =>
  process.env.EXPO_PUBLIC_INSTANT_APP_ID === QUANTITY_TEST_APP &&
  ((typeof __DEV__ !== 'undefined' && __DEV__) ||
    process.env.EXPO_PUBLIC_QUANTITY_RELEASE === '1');
