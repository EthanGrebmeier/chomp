export type IngredientCategory = string;

// Request
export type ParseRecipeUrlRequest = {
  url: string;
};

// Response
export type ParseRecipeUrlResponse = {
  sourceUrl: string;
  recipeName: string | null;
  servings: string | null;
  ingredients: ParsedIngredient[];
};

export type ParsedIngredient = {
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  category: IngredientCategory;
};

/** Error codes returned by the server. */
export type ParseRecipeUrlServerErrorCode =
  | 'invalid_url'
  | 'unsupported_content'
  | 'unauthorized'
  | 'not_found'
  | 'fetch_timeout'
  | 'content_too_large'
  | 'parse_failed'
  | 'rate_limited'
  | 'server_error';

/**
 * Error codes raised on the client before/while talking to the server.
 * Kept distinct so the UI can tell "your device is offline" apart from
 * "the recipe website is slow" (which the server reports as fetch_timeout).
 */
export type ParseRecipeUrlClientErrorCode =
  | 'offline'
  | 'network_error'
  | 'request_timeout'
  | 'cancelled'
  | 'config_error';

export type ParseRecipeUrlErrorCode =
  | ParseRecipeUrlServerErrorCode
  | ParseRecipeUrlClientErrorCode;

export type ParseRecipeUrlError = {
  error: {
    code: ParseRecipeUrlServerErrorCode;
    message: string;
  };
};

// Rate limit headers from API response
export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetSeconds: number;
};
