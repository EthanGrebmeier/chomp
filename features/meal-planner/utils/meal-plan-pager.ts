type DatedEntry = {
  date: string;
};

export function groupMealPlanEntriesByDate<T extends DatedEntry>(
  entries: readonly T[]
): Map<string, T[]> {
  const entriesByDate = new Map<string, T[]>();

  for (const entry of entries) {
    const dateEntries = entriesByDate.get(entry.date);
    if (dateEntries) {
      dateEntries.push(entry);
    } else {
      entriesByDate.set(entry.date, [entry]);
    }
  }

  return entriesByDate;
}

export function isPageWithinActiveWindow(
  pageIndex: number,
  currentPageIndex: number,
  windowSize = 1
): boolean {
  return Math.abs(pageIndex - currentPageIndex) <= windowSize;
}
