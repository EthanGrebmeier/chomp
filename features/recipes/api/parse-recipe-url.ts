import {
  ParseRecipeUrlError,
  ParseRecipeUrlErrorCode,
  ParseRecipeUrlRequest,
  ParseRecipeUrlResponse,
  RateLimitInfo,
} from './types';

/**
 * Upper bound for a single parse request. The server budget is roughly
 * 10s HTML fetch + 30s AI extraction, plus headroom for a cold start.
 */
export const PARSE_RECIPE_URL_TIMEOUT_MS = 60_000;

export class RecipeParseError extends Error {
  code: ParseRecipeUrlErrorCode;
  rateLimitInfo?: RateLimitInfo;

  constructor(
    code: ParseRecipeUrlErrorCode,
    message: string,
    rateLimitInfo?: RateLimitInfo
  ) {
    super(message);
    this.name = 'RecipeParseError';
    this.code = code;
    this.rateLimitInfo = rateLimitInfo;
  }
}

export type ParseRecipeUrlOptions = {
  /** Caller-owned signal, e.g. for a Cancel button. */
  signal?: AbortSignal;
  timeoutMs?: number;
};

const parseIntHeader = (value: string | null, fallback: number) => {
  const parsed = parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const readRateLimitInfo = (headers: Headers): RateLimitInfo | undefined => {
  if (!headers.get('X-RateLimit-Limit')) return undefined;
  return {
    limit: parseIntHeader(headers.get('X-RateLimit-Limit'), 30),
    remaining: parseIntHeader(headers.get('X-RateLimit-Remaining'), 30),
    resetSeconds: parseIntHeader(headers.get('X-RateLimit-Reset'), 60),
  };
};

const isParseRecipeUrlError = (value: unknown): value is ParseRecipeUrlError =>
  typeof value === 'object' &&
  value !== null &&
  'error' in value &&
  typeof (value as ParseRecipeUrlError).error?.code === 'string' &&
  typeof (value as ParseRecipeUrlError).error?.message === 'string';

/**
 * Builds a RecipeParseError from a non-OK response. Infrastructure layers
 * (Fly proxy, CDN) may return HTML or empty bodies on 502/504, so never
 * assume the body is our JSON error shape.
 */
const errorFromResponse = async (
  response: Response,
  rateLimitInfo?: RateLimitInfo
): Promise<RecipeParseError> => {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (isParseRecipeUrlError(body)) {
    return new RecipeParseError(
      body.error.code,
      body.error.message,
      rateLimitInfo
    );
  }

  if (response.status === 401 || response.status === 403) {
    return new RecipeParseError('unauthorized', 'Not authenticated');
  }
  if (response.status === 429) {
    return new RecipeParseError(
      'rate_limited',
      'Too many requests',
      rateLimitInfo
    );
  }

  // 502/503/504 from the edge usually mean the API machine is starting up.
  return new RecipeParseError(
    'server_error',
    `Unexpected response from server (${response.status})`
  );
};

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === 'AbortError';

export const parseRecipeUrl = async (
  request: ParseRecipeUrlRequest,
  token: string,
  options: ParseRecipeUrlOptions = {}
): Promise<ParseRecipeUrlResponse> => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new RecipeParseError('config_error', 'API URL not configured');
  }

  const timeoutMs = options.timeoutMs ?? PARSE_RECIPE_URL_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onExternalAbort);
  if (options.signal?.aborted) controller.abort();

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/recipes/ingredients-from-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw timedOut
        ? new RecipeParseError('request_timeout', 'Request timed out')
        : new RecipeParseError('cancelled', 'Import cancelled');
    }
    throw new RecipeParseError(
      'network_error',
      'Could not reach the import service'
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }

  const rateLimitInfo = readRateLimitInfo(response.headers);

  if (!response.ok) {
    throw await errorFromResponse(response, rateLimitInfo);
  }

  try {
    return (await response.json()) as ParseRecipeUrlResponse;
  } catch {
    throw new RecipeParseError(
      'parse_failed',
      'Received an invalid response from the server'
    );
  }
};
