export const EMAIL_LINK_CALLBACK_PATH = 'verify-email-link';
export const EMAIL_LINK_CONTINUE_ROUTE = '/(auth)/continue';
export const EMAIL_LINK_COMPLETE_ROUTE = '/(tabs)';
const DEFAULT_EMAIL_LINK_BASE_URL = 'https://chompgrocery.com';

const getEmailLinkBaseUrl = () =>
  (
    process.env.EXPO_PUBLIC_EMAIL_LINK_BASE_URL ?? DEFAULT_EMAIL_LINK_BASE_URL
  ).replace(/\/$/, '');

export const getEmailLinkRedirectUrl = () =>
  `${getEmailLinkBaseUrl()}/${EMAIL_LINK_CALLBACK_PATH}`;
