export const EMAIL_LINK_CALLBACK_PATH = 'verify-email-link';
export const EMAIL_LINK_CONTINUE_ROUTE = '/(auth)/continue';
export const EMAIL_LINK_COMPLETE_ROUTE = '/(tabs)';
export const EMAIL_LINK_FLOW_PARAM = 'flow';
const DEFAULT_EMAIL_LINK_BASE_URL = 'https://chompgrocery.com';

export type EmailLinkFlow = 'sign-in' | 'sign-up';

const getEmailLinkBaseUrl = () =>
  (
    process.env.EXPO_PUBLIC_EMAIL_LINK_BASE_URL ?? DEFAULT_EMAIL_LINK_BASE_URL
  ).replace(/\/$/, '');

export const getEmailLinkRedirectUrl = (flow?: EmailLinkFlow) => {
  const baseUrl = `${getEmailLinkBaseUrl()}/${EMAIL_LINK_CALLBACK_PATH}`;

  if (!flow) {
    return baseUrl;
  }

  return `${baseUrl}?${EMAIL_LINK_FLOW_PARAM}=${flow}`;
};
