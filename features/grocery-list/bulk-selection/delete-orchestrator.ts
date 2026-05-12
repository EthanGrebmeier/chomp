export type BulkDeleteResult = 'cancelled' | 'deleted' | 'noop';

export type RunBulkDeleteArgs = {
  selectedItemIds: Set<string>;
  confirmDelete: (selectedCount: number) => Promise<boolean>;
  deleteItems: (itemIds: string[]) => Promise<void>;
  onDeleteSuccess: () => void;
};

export const runBulkDelete = async ({
  selectedItemIds,
  confirmDelete,
  deleteItems,
  onDeleteSuccess,
}: RunBulkDeleteArgs): Promise<BulkDeleteResult> => {
  if (selectedItemIds.size === 0) {
    return 'noop';
  }

  const selectedCount = selectedItemIds.size;
  const confirmed = await confirmDelete(selectedCount);
  if (!confirmed) {
    return 'cancelled';
  }

  await deleteItems(Array.from(selectedItemIds));
  onDeleteSuccess();
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
