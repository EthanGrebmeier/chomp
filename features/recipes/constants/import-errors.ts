import { ParseRecipeUrlErrorCode } from '../api/types';

export const IMPORT_ERROR_MESSAGES: Record<ParseRecipeUrlErrorCode, string> = {
  invalid_url: 'Please enter a valid URL starting with http:// or https://',
  unsupported_content: "This page doesn't appear to contain a recipe",
  unauthorized: 'Please sign in to import recipes',
  not_found: 'The recipe page could not be found',
  fetch_timeout: 'The request timed out. Please try again',
  content_too_large: 'This page is too large to process',
  parse_failed: 'Unable to extract ingredients from this recipe',
  rate_limited: 'Too many requests. Please wait a moment and try again',
  server_error: 'Something went wrong. Please try again later',
};

export const getImportErrorMessage = (code: ParseRecipeUrlErrorCode): string => {
  return IMPORT_ERROR_MESSAGES[code] ?? 'An unexpected error occurred';
};
