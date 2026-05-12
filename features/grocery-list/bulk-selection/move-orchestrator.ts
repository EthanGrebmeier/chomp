type BuildBulkMoveSelectionPayloadInput = {
  selectedItemIds: Set<string>;
  sourceListId?: string;
  destinationListId?: string;
};

export type BulkMoveSelectionPayload = {
  selectedItemIds: string[];
  sourceListId: string;
  destinationListId: string;
};

export type BulkMoveItemForPlanning = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  updatedAt?: string;
  store?: {
    id?: string;
    name?: string;
  } | null;
};

type BulkMoveSourceItem = BulkMoveItemForPlanning & {
  isChecked?: boolean;
};

type BulkMoveAggregatedCreateEntry = {
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  isChecked: boolean;
  storeId?: string;
};

export type BulkMovePlan = {
  quantityUpdates: Map<string, number>;
  createEntries: BulkMoveAggregatedCreateEntry[];
  sourceItemIdsToRemove: string[];
  skippedItemCount: number;
};

type BuildBulkMovePlanArgs = {
  selectedItemIds: string[];
  selectedItems: BulkMoveSourceItem[];
  destinationItems: BulkMoveItemForPlanning[];
};

export type RunBulkMoveResult = 'noop' | 'moved';

type RunBulkMoveArgs = {
  moveSelectionPayload: BulkMoveSelectionPayload;
  selectedItems: BulkMoveSourceItem[];
  fetchDestinationItems: (destinationListId: string) => Promise<BulkMoveItemForPlanning[]>;
  applyDestinationPlan: (
    plan: BulkMovePlan,
    destinationListId: string,
    destinationItems: BulkMoveItemForPlanning[]
  ) => Promise<void>;
  removeSourceItems: (itemIds: string[]) => Promise<void>;
  onMoveSuccess: () => void;
};

type ExistingByMatchKey = Map<string, BulkMoveItemForPlanning>;

const normalizeToken = (value?: string | null): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const buildMoveMatchKey = ({
  name,
  unit,
  category,
  storeName,
}: {
  name: string;
  unit: string;
  category?: string | null;
  storeName?: string | null;
}) =>
  `${normalizeToken(name)}|${normalizeToken(unit)}|${normalizeToken(category)}|${normalizeToken(storeName)}`;

const byMostRecentlyUpdated = (
  left: Pick<BulkMoveItemForPlanning, 'updatedAt'>,
  right: Pick<BulkMoveItemForPlanning, 'updatedAt'>
) => {
  const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0;
  const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0;
  return rightTime - leftTime;
};

const buildExistingDestinationMap = (
  destinationItems: BulkMoveItemForPlanning[]
): ExistingByMatchKey => {
  const existingByMatchKey: ExistingByMatchKey = new Map();

  for (const destinationItem of destinationItems) {
    const key = buildMoveMatchKey({
      name: destinationItem.name,
      unit: destinationItem.unit,
      category: destinationItem.category,
      storeName: destinationItem.store?.name,
    });
    const current = existingByMatchKey.get(key);
    if (!current || byMostRecentlyUpdated(current, destinationItem) > 0) {
      existingByMatchKey.set(key, destinationItem);
    }
  }

  return existingByMatchKey;
};

const aggregateSelectedSourceItems = (selectedItems: BulkMoveSourceItem[]) => {
  const aggregated = new Map<string, BulkMoveAggregatedCreateEntry>();

  for (const item of selectedItems) {
    const key = buildMoveMatchKey({
      name: item.name,
      unit: item.unit,
      category: item.category,
      storeName: item.store?.name,
    });
    const existing = aggregated.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      if (!existing.notes && item.notes) {
        existing.notes = item.notes;
      }
      continue;
    }

    aggregated.set(key, {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes,
      category: item.category,
      isChecked: Boolean(item.isChecked),
      storeId: item.store?.id,
    });
  }

  return aggregated;
};

export const buildBulkMovePlan = ({
  selectedItemIds,
  selectedItems,
  destinationItems,
}: BuildBulkMovePlanArgs): BulkMovePlan => {
  if (selectedItemIds.length === 0) {
    return {
      quantityUpdates: new Map(),
      createEntries: [],
      sourceItemIdsToRemove: [],
      skippedItemCount: 0,
    };
  }

  const selectedItemsMap = new Map(selectedItems.map(item => [item.id, item]));
  const sourceItemIdsToRemove: string[] = [];
  let skippedItemCount = 0;

  const selectedSourceItemsInOrder = [...selectedItemIds]
    .sort()
    .flatMap(itemId => {
      const item = selectedItemsMap.get(itemId);
      if (!item) {
        skippedItemCount += 1;
        return [];
      }
      sourceItemIdsToRemove.push(itemId);
      return [item];
    });

  if (selectedSourceItemsInOrder.length === 0) {
    return {
      quantityUpdates: new Map(),
      createEntries: [],
      sourceItemIdsToRemove: [],
      skippedItemCount,
    };
  }

  const destinationItemsByKey = buildExistingDestinationMap(destinationItems);
  const aggregatedSourceItems = aggregateSelectedSourceItems(
    selectedSourceItemsInOrder
  );
  const quantityUpdates = new Map<string, number>();
  const createEntries: BulkMoveAggregatedCreateEntry[] = [];

  for (const [key, sourceEntry] of aggregatedSourceItems.entries()) {
    const destinationMatch = destinationItemsByKey.get(key);
    if (destinationMatch) {
      quantityUpdates.set(
        destinationMatch.id,
        (quantityUpdates.get(destinationMatch.id) ?? 0) + sourceEntry.quantity
      );
      continue;
    }

    createEntries.push(sourceEntry);
  }

  return {
    quantityUpdates,
    createEntries,
    sourceItemIdsToRemove,
    skippedItemCount,
  };
};

export const runBulkMove = async ({
  moveSelectionPayload,
  selectedItems,
  fetchDestinationItems,
  applyDestinationPlan,
  removeSourceItems,
  onMoveSuccess,
}: RunBulkMoveArgs): Promise<RunBulkMoveResult> => {
  const destinationItems = await fetchDestinationItems(
    moveSelectionPayload.destinationListId
  );
  const plan = buildBulkMovePlan({
    selectedItemIds: moveSelectionPayload.selectedItemIds,
    selectedItems,
    destinationItems,
  });

  if (plan.sourceItemIdsToRemove.length === 0) {
    return 'noop';
  }

  await applyDestinationPlan(
    plan,
    moveSelectionPayload.destinationListId,
    destinationItems
  );
  await removeSourceItems(plan.sourceItemIdsToRemove);
  onMoveSuccess();

  return 'moved';
};

export const buildBulkMoveSelectionPayload = ({
  selectedItemIds,
  sourceListId,
  destinationListId,
}: BuildBulkMoveSelectionPayloadInput): BulkMoveSelectionPayload | null => {
  if (!sourceListId || !destinationListId) {
    return null;
  }

  if (sourceListId === destinationListId || selectedItemIds.size === 0) {
    return null;
  }

  return {
    selectedItemIds: [...selectedItemIds],
    sourceListId,
    destinationListId,
  };
};
