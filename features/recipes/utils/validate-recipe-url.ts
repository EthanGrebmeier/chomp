export type UrlValidationResult =
  | { valid: true; url: string }
  | { valid: false; error: string };

export const validateRecipeUrl = (input: string): UrlValidationResult => {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, error: 'Please enter a URL' };
  }

  try {
    const url = new URL(trimmed);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'URL must start with http:// or https://' };
    }

    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, error: 'Please enter a valid URL' };
  }
};
