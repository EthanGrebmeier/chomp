export type BulkDeleteResult = 'cancelled' | 'deleted' | 'noop';

export type RunBulkDeleteArgs = {
  selectedItemIds: Set<string>;
  confirmDelete: (selectedCount: number) => Promise<boolean>;
  deleteItems: (itemIds: string[]) => Promise<void>;
  /**
   * Runs once the user confirms, before the write is awaited, so the UI can
   * leave bulk mode immediately instead of waiting on the delete.
   */
  onDeleteConfirmed: () => void;
};

export const runBulkDelete = async ({
  selectedItemIds,
  confirmDelete,
  deleteItems,
  onDeleteConfirmed,
}: RunBulkDeleteArgs): Promise<BulkDeleteResult> => {
  if (selectedItemIds.size === 0) {
    return 'noop';
  }

  const selectedCount = selectedItemIds.size;
  const confirmed = await confirmDelete(selectedCount);
  if (!confirmed) {
    return 'cancelled';
  }

  const itemIds = Array.from(selectedItemIds);
  onDeleteConfirmed();
  await deleteItems(itemIds);
  return 'deleted';
};

export const getBulkDeleteConfirmationCopy = (selectedCount: number) => {
  const itemLabel = selectedCount === 1 ? 'item' : 'items';

  return {
    title: `Delete ${selectedCount} ${itemLabel}?`,
    description:
      'This will remove the selected items from your list. This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  };
};
