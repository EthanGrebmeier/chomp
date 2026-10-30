type List = { id: string };

/** Local order is a preload hint; the workspace still verifies access remotely. */
export function entryListId(
  lists: readonly List[],
  loading: boolean,
  requested: string | undefined,
  accessTimes: Readonly<Record<string, string>>
) {
  if (!loading)
    return lists.find(list => list.id === requested)?.id ?? lists[0]?.id;
  return (
    requested ??
    Object.entries(accessTimes).sort((a, b) => b[1].localeCompare(a[1]))[0]?.[0]
  );
}

/** Retain started sessions across selection changes so pending saves stay mounted. */
export function retainEntryLists(
  started: readonly string[],
  priority: string | undefined,
  lists: readonly List[],
  loading: boolean
): readonly string[] {
  const available = new Set(lists.map(list => list.id));
  const next = started.filter(id => loading || available.has(id));
  if (priority && !next.includes(priority)) next.push(priority);
  return next.length === started.length &&
    next.every((id, index) => id === started[index])
    ? started
    : next;
}
