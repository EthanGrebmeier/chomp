import type { MatchingItem } from './use-matching-items';

export const hasSavedItemLink = (item: MatchingItem | null): boolean =>
  (item?.source === 'cloud' && !!item.cloudSavedItemId) ||
  (item?.source === 'local' && !!item.localSavedItemId);

// Casing and surrounding whitespace do not turn a picked item into a new one.
// Once detached, typing the original title again must not silently relink it.
export const keepSelectedItemForTitle = (
  item: MatchingItem | null,
  title: string
): MatchingItem | null =>
  item?.name.trim().toLowerCase() === title.trim().toLowerCase() ? item : null;
