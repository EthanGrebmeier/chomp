import {
  CUSTOM_UNIT_VALUE,
  DEFAULT_UNIT_VALUE,
  MAX_UNIT_LENGTH,
  UNIT_OPTIONS,
} from './units';

const CATALOG_OPTIONS = UNIT_OPTIONS.filter(
  option => option.value !== CUSTOM_UNIT_VALUE
);

const normalizeCatalogUnit = (value: string) => {
  const normalizedValue = value.toLowerCase();
  return CATALOG_OPTIONS.find(
    option =>
      option.value.toLowerCase() === normalizedValue ||
      option.label.toLowerCase() === normalizedValue
  )?.value;
};

export const normalizeUnit = (unit?: string | null) => {
  if (!unit) {
    return DEFAULT_UNIT_VALUE;
  }

  const trimmed = unit.trim();
  if (!trimmed) {
    return DEFAULT_UNIT_VALUE;
  }

  const limited = trimmed.slice(0, MAX_UNIT_LENGTH);
  return normalizeCatalogUnit(limited) ?? limited;
};

export const formatQuantityUnit = (quantity: number, unit?: string | null) => {
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === DEFAULT_UNIT_VALUE) {
    return `x${quantity}`;
  }

  return `${quantity} ${normalizedUnit}`;
};
