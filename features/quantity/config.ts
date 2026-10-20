/** Isolated development app; a release build cannot activate this workspace. */
export const QUANTITY_TEST_APP = '5df33e29-252b-4e1c-a111-53787beccba3';
export const quantityWorkspaceAvailable = () =>
  __DEV__ && process.env.EXPO_PUBLIC_INSTANT_APP_ID === QUANTITY_TEST_APP;
