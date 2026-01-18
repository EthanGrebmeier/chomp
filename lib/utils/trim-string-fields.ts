export const trimStringFields = <T>(value: T): T => {
  if (typeof value === 'string') {
    return value.trim() as T;
  }

  if (Array.isArray(value)) {
    return value.map(trimStringFields) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, entryValue]) => [
      key,
      trimStringFields(entryValue),
    ]);
    return Object.fromEntries(entries) as T;
  }

  return value;
};
