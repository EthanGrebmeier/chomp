/** Development integration only; release builds keep the established data path. */
export const QUANTITY_TEST_APP = '5df33e29-252b-4e1c-a111-53787beccba3';
export const quantityWorkspaceAvailable = () =>
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  process.env.EXPO_PUBLIC_INSTANT_APP_ID === QUANTITY_TEST_APP;
