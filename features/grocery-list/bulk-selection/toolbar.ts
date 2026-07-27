export type BulkToolbarActionId =
  | 'exit'
  | 'set-store'
  | 'set-category'
  | 'move'
  | 'delete';

export type BulkToolbarAction = {
  id: BulkToolbarActionId;
  label: string;
  isDestructive: boolean;
  isDisabled: boolean;
};

const BULK_TOOLBAR_ACTION_DEFINITIONS: Omit<BulkToolbarAction, 'isDisabled'>[] =
  [
    {
      id: 'exit',
      label: 'Exit Bulk Select',
      isDestructive: false,
    },
    {
      id: 'set-store',
      label: 'Set Store',
      isDestructive: false,
    },
    {
      id: 'set-category',
      label: 'Set Category',
      isDestructive: false,
    },
    {
      id: 'move',
      label: 'Move',
      isDestructive: false,
    },
    {
      id: 'delete',
      label: 'Delete',
      isDestructive: true,
    },
  ];

export const getBulkToolbarActions = (
  selectedItemCount: number
): BulkToolbarAction[] => {
  const isSelectionRequiredDisabled = selectedItemCount <= 0;

  return BULK_TOOLBAR_ACTION_DEFINITIONS.map(action => ({
    ...action,
    isDisabled: action.id === 'exit' ? false : isSelectionRequiredDisabled,
  }));
};
