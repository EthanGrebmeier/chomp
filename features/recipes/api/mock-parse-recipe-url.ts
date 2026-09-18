/**
 * Local mock for the recipe URL parser.
 *
 * Enable by adding `EXPO_PUBLIC_MOCK_RECIPE_IMPORT=true` to `.env.local` and
 * restarting the dev server. Remove the line to go back to the real API.
 * The `__DEV__` guard means this can never be active in a release build.
 *
 * Scenarios are chosen by the URL you paste, so every UI state is reachable
 * without touching code:
 *
 *   https://mock.test/success            default; happy path (~2.5s)
 *   https://mock.test/slow               happy path after 15s (exercises staged loading)
 *   https://mock.test/empty              recipe found, zero ingredients
 *   https://mock.test/no-name            ingredients found, recipeName is null
 *   https://mock.test/fetch_timeout      any server error code works as a path
 *   https://mock.test/rate_limited       ...includes rate limit headers
 *   https://mock.test/network_error      any client error code works too
 *
 * Any URL that doesn't match a scenario falls through to `success`.
 */
import {
  parseRecipeUrl,
  ParseRecipeUrlOptions,
  RecipeParseError,
} from './parse-recipe-url';
import {
  ParseRecipeUrlErrorCode,
  ParseRecipeUrlRequest,
  ParseRecipeUrlResponse,
} from './types';

export const isMockRecipeImportEnabled = () =>
  __DEV__ && process.env.EXPO_PUBLIC_MOCK_RECIPE_IMPORT === 'true';

const DEFAULT_DELAY_MS = 2_500;
const SLOW_DELAY_MS = 15_000;

const ERROR_CODES: ParseRecipeUrlErrorCode[] = [
  'invalid_url',
  'unsupported_content',
  'unauthorized',
  'not_found',
  'fetch_timeout',
  'content_too_large',
  'parse_failed',
  'rate_limited',
  'server_error',
  'offline',
  'network_error',
  'request_timeout',
  'config_error',
];

const isErrorCode = (value: string): value is ParseRecipeUrlErrorCode =>
  (ERROR_CODES as string[]).includes(value);

const MOCK_INGREDIENTS: ParseRecipeUrlResponse['ingredients'] = [
  {
    name: 'Boneless chicken breast',
    quantity: 1.5,
    unit: 'lb',
    notes: 'cut into bite-size pieces',
    category: 'Deli',
  },
  {
    name: 'Penne pasta',
    quantity: 12,
    unit: 'oz',
    notes: null,
    category: 'Pantry',
  },
  {
    name: 'Heavy cream',
    quantity: 1,
    unit: 'cup',
    notes: null,
    category: 'Dairy',
  },
  {
    name: 'Parmesan cheese',
    quantity: 0.5,
    unit: 'cup',
    notes: 'freshly grated',
    category: 'Dairy',
  },
  {
    name: 'Baby spinach',
    quantity: 4,
    unit: 'cup',
    notes: 'packed',
    category: 'Produce',
  },
  {
    name: 'Garlic cloves',
    quantity: 4,
    unit: null,
    notes: 'minced',
    category: 'Produce',
  },
  {
    name: 'Olive oil',
    quantity: 2,
    unit: 'tbsp',
    notes: null,
    category: 'Pantry',
  },
  {
    name: 'Kosher salt',
    quantity: null,
    unit: null,
    notes: 'to taste',
    category: 'Pantry',
  },
  {
    name: 'Black pepper',
    quantity: 0.5,
    unit: 'tsp',
    notes: 'freshly cracked',
    category: 'Pantry',
  },
  {
    name: 'Lemon',
    quantity: 1,
    unit: null,
    notes: 'zested and juiced',
    category: 'Produce',
  },
  {
    name: 'Red pepper flakes',
    quantity: 0.25,
    unit: 'tsp',
    notes: null,
    category: 'Pantry',
  },
  {
    name: 'Fresh basil',
    quantity: null,
    unit: null,
    notes: 'for garnish',
    category: 'Produce',
  },
];

const buildSuccess = (
  url: string,
  overrides: Partial<ParseRecipeUrlResponse> = {}
): ParseRecipeUrlResponse => ({
  sourceUrl: url,
  recipeName: 'Creamy Garlic Chicken Pasta',
  servings: '4',
  ingredients: MOCK_INGREDIENTS,
  ...overrides,
});

const getScenario = (url: string): string => {
  try {
    const segment = new URL(url).pathname.split('/').filter(Boolean).pop();
    return segment ?? 'success';
  } catch {
    return 'success';
  }
};

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new RecipeParseError('cancelled', 'Import cancelled'));
    };
    if (signal?.aborted) return abort();
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });

export const mockParseRecipeUrl: typeof parseRecipeUrl = async (
  request: ParseRecipeUrlRequest,
  _token: string,
  options: ParseRecipeUrlOptions = {}
) => {
  const scenario = getScenario(request.url);
  const delayMs = scenario === 'slow' ? SLOW_DELAY_MS : DEFAULT_DELAY_MS;

  await wait(delayMs, options.signal);

  if (isErrorCode(scenario)) {
    throw new RecipeParseError(
      scenario,
      `Mock ${scenario}`,
      scenario === 'rate_limited'
        ? { limit: 30, remaining: 0, resetSeconds: 42 }
        : undefined
    );
  }

  switch (scenario) {
    case 'empty':
      return buildSuccess(request.url, { ingredients: [] });
    case 'no-name':
      return buildSuccess(request.url, { recipeName: null });
    default:
      return buildSuccess(request.url);
  }
};
