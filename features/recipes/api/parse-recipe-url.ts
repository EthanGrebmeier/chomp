import {
  ParseRecipeUrlError,
  ParseRecipeUrlRequest,
  ParseRecipeUrlResponse,
  RateLimitInfo,
} from './types';

export class RecipeParseError extends Error {
  code: string;
  rateLimitInfo?: RateLimitInfo;

  constructor(code: string, message: string, rateLimitInfo?: RateLimitInfo) {
    super(message);
    this.name = 'RecipeParseError';
    this.code = code;
    this.rateLimitInfo = rateLimitInfo;
  }
}

export const parseRecipeUrl = async (
  request: ParseRecipeUrlRequest,
  token: string
): Promise<ParseRecipeUrlResponse> => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new RecipeParseError('config_error', 'API URL not configured');
  }

  const response = await fetch(`${apiUrl}/api/recipes/ingredients-from-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  // Extract rate limit info from headers
  const rateLimitInfo: RateLimitInfo | undefined = response.headers.get(
    'X-RateLimit-Limit'
  )
    ? {
        limit: parseInt(
          response.headers.get('X-RateLimit-Limit') ?? '30',
          10
        ),
        remaining: parseInt(
          response.headers.get('X-RateLimit-Remaining') ?? '30',
          10
        ),
        resetSeconds: parseInt(
          response.headers.get('X-RateLimit-Reset') ?? '60',
          10
        ),
      }
    : undefined;

  if (!response.ok) {
    const errorBody = (await response.json()) as ParseRecipeUrlError;
    throw new RecipeParseError(
      errorBody.error.code,
      errorBody.error.message,
      rateLimitInfo
    );
  }

  return response.json() as Promise<ParseRecipeUrlResponse>;
};
