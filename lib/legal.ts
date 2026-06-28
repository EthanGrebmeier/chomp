import * as WebBrowser from 'expo-web-browser';

export const LEGAL_URLS = {
  privacy: 'https://chompgrocery.com/privacy',
  terms: 'https://chompgrocery.com/terms',
} as const;

export type LegalDocument = keyof typeof LEGAL_URLS;

export const openLegalLink = (document: LegalDocument) =>
  WebBrowser.openBrowserAsync(LEGAL_URLS[document]);
