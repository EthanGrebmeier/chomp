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

// Error codes matching API spec
export type ParseRecipeUrlErrorCode =
  | 'invalid_url'
  | 'unsupported_content'
  | 'unauthorized'
  | 'not_found'
  | 'fetch_timeout'
  | 'content_too_large'
  | 'parse_failed'
  | 'rate_limited'
  | 'server_error';

export type ParseRecipeUrlError = {
  error: {
    code: ParseRecipeUrlErrorCode;
    message: string;
  };
};

// Rate limit headers from API response
export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetSeconds: number;
};
