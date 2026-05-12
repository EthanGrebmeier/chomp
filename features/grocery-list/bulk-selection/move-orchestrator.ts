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
