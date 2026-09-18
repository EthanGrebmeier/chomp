import {
  CircleAlertIcon,
  ClockIcon,
  FileXIcon,
  GlobeIcon,
  LinkIcon,
  LockIcon,
  LucideIcon,
  ServerCrashIcon,
  SettingsIcon,
  WifiOffIcon,
  CircleXIcon,
} from 'lucide-react-native';

import { ParseRecipeUrlErrorCode } from '../api/types';

export type ImportErrorPresentation = {
  /** Short headline, e.g. "That website took too long to respond" */
  title: string;
  /** One sentence of guidance; omit when the title says it all. */
  hint?: string;
  icon: LucideIcon;
  /**
   * Whether "Try Again" (same URL) is a sensible primary action.
   * False means the user needs to change the URL or something else first.
   */
  retryable: boolean;
};

/**
 * Single source of truth for how each parse error is shown.
 *
 * Copy is written from the user's point of view and is careful about blame:
 * `fetch_timeout` is *the recipe website* being slow, `offline` is *the
 * device*, `server_error` is *us*.
 */
export const IMPORT_ERRORS: Record<
  ParseRecipeUrlErrorCode,
  ImportErrorPresentation
> = {
  // --- Problems with the link -------------------------------------------
  invalid_url: {
    title: "That doesn't look like a valid link",
    hint: 'Check that it starts with http:// or https:// and is complete.',
    icon: LinkIcon,
    retryable: false,
  },
  not_found: {
    title: "We couldn't find that page",
    hint: 'It may have been moved or deleted. Double-check the link.',
    icon: FileXIcon,
    retryable: false,
  },

  // --- Problems with the page content -----------------------------------
  unsupported_content: {
    title: "We couldn't find a recipe on that page",
    hint: 'Try linking directly to the recipe rather than a homepage or search result.',
    icon: FileXIcon,
    retryable: false,
  },
  parse_failed: {
    title: "We couldn't read the ingredients on that page",
    hint: 'This sometimes happens with unusual layouts. You can still create the recipe manually.',
    icon: FileXIcon,
    retryable: true,
  },
  content_too_large: {
    title: 'That page is too large to process',
    hint: 'Try a link to a simpler version of the recipe, such as a print view.',
    icon: FileXIcon,
    retryable: false,
  },

  // --- The recipe website ------------------------------------------------
  fetch_timeout: {
    title: 'That website took too long to respond',
    hint: 'The recipe site may be slow or temporarily down. Try again in a moment.',
    icon: GlobeIcon,
    retryable: true,
  },

  // --- Your device / connection -----------------------------------------
  offline: {
    title: "You're offline",
    hint: 'Connect to Wi-Fi or mobile data and try again.',
    icon: WifiOffIcon,
    retryable: true,
  },
  network_error: {
    title: "We couldn't reach the import service",
    hint: 'Check your connection and try again.',
    icon: WifiOffIcon,
    retryable: true,
  },
  request_timeout: {
    title: 'The import took too long',
    hint: 'The site may be slow or your connection unstable. Try again in a moment.',
    icon: ClockIcon,
    retryable: true,
  },
  cancelled: {
    title: 'Import cancelled',
    icon: CircleXIcon,
    retryable: true,
  },

  // --- Us -----------------------------------------------------------------
  server_error: {
    title: 'Something went wrong on our end',
    hint: 'Please try again in a moment.',
    icon: ServerCrashIcon,
    retryable: true,
  },
  rate_limited: {
    title: "You've imported a lot of recipes recently",
    hint: 'Please wait a moment before trying again.',
    icon: ClockIcon,
    retryable: true,
  },
  unauthorized: {
    title: 'Please sign in to import recipes',
    icon: LockIcon,
    retryable: false,
  },
  config_error: {
    title: 'Recipe import is not configured',
    hint: 'Please update the app and try again.',
    icon: SettingsIcon,
    retryable: false,
  },
};

const FALLBACK_ERROR: ImportErrorPresentation = {
  title: 'Something went wrong',
  hint: 'Please try again.',
  icon: CircleAlertIcon,
  retryable: true,
};

export const getImportErrorPresentation = (
  code: string
): ImportErrorPresentation =>
  IMPORT_ERRORS[code as ParseRecipeUrlErrorCode] ?? FALLBACK_ERROR;
