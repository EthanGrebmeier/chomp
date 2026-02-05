import {
  AlertCircleIcon,
  ClockIcon,
  FileXIcon,
  LinkIcon,
  LockIcon,
  ServerCrashIcon,
  WifiOffIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

import { RecipeParseError } from '../../api/parse-recipe-url';
import { ParseRecipeUrlErrorCode } from '../../api/types';
import { getImportErrorMessage } from '../../constants/import-errors';

type ImportErrorProps = {
  error: RecipeParseError;
};

/** Error codes that can be retried without changing the URL */
export const RETRYABLE_ERROR_CODES: ParseRecipeUrlErrorCode[] = [
  'fetch_timeout',
  'server_error',
  'rate_limited',
];

/**
 * Returns the appropriate icon component based on the error code.
 * Icons are contextual to help users understand the type of error.
 */
function getErrorIcon(code: ParseRecipeUrlErrorCode) {
  switch (code) {
    case 'invalid_url':
      return LinkIcon; // URL/link issue
    case 'unauthorized':
      return LockIcon; // Auth issue
    case 'fetch_timeout':
      return WifiOffIcon; // Network/timeout issue
    case 'rate_limited':
      return ClockIcon; // Need to wait
    case 'server_error':
      return ServerCrashIcon; // Server issue
    case 'not_found':
    case 'parse_failed':
    case 'unsupported_content':
    case 'content_too_large':
      return FileXIcon; // Content/page issue
    default:
      return AlertCircleIcon; // Generic error
  }
}

/**
 * Returns a helpful hint based on the error code to guide the user.
 */
function getErrorHint(code: ParseRecipeUrlErrorCode): string | null {
  switch (code) {
    case 'invalid_url':
      return 'Check that the URL is complete and correctly formatted';
    case 'unsupported_content':
      return 'Try a different recipe page from a popular cooking website';
    case 'not_found':
      return 'The page may have been moved or deleted';
    case 'fetch_timeout':
      return 'This might be due to a slow connection';
    case 'content_too_large':
      return 'Try a simpler recipe page with fewer images';
    case 'parse_failed':
      return 'The recipe format may not be supported';
    case 'rate_limited':
      return 'Please wait a moment before trying again';
    default:
      return null;
  }
}

export function ImportError({ error }: ImportErrorProps) {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;

  const errorCode = error.code as ParseRecipeUrlErrorCode;
  const errorMessage = getImportErrorMessage(errorCode);
  const errorHint = getErrorHint(errorCode);
  const IconComponent = getErrorIcon(errorCode);

  // For rate limited errors with rate limit info, show countdown
  const rateLimitReset = error.rateLimitInfo?.resetSeconds;
  const showRateLimitInfo = errorCode === 'rate_limited' && rateLimitReset;

  return (
    <View className="items-center py-6">
      {/* Error Icon */}
      <View className="mb-4 rounded-full bg-destructive/10 p-4">
        <IconComponent size={32} color={theme.destructive} />
      </View>

      {/* Error Message */}
      <Text className="mb-2 text-center text-lg font-semibold text-foreground">
        {errorMessage}
      </Text>

      {/* Error Hint */}
      {errorHint && (
        <Text className="mb-4 text-center text-sm text-muted-foreground">
          {errorHint}
        </Text>
      )}

      {/* Rate Limit Info */}
      {showRateLimitInfo && (
        <View className="mb-4 rounded-lg bg-muted/50 px-4 py-2">
          <Text className="text-center text-sm text-muted-foreground">
            Try again in {rateLimitReset} seconds
          </Text>
        </View>
      )}

      {/* Actions are rendered in the sheet footer */}
    </View>
  );
}
