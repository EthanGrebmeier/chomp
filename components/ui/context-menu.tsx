import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import * as ContextMenu from 'zeego/context-menu';

type ContextMenuRootProps = {
  trigger: ReactNode;
  children: ReactNode;
};

export const ContextMenuRoot = ({
  trigger,
  children,
}: ContextMenuRootProps) => {
  return (
    <ContextMenu.Root
      onOpenChange={open => {
        if (open) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }}
    >
      <ContextMenu.Trigger asChild>{trigger}</ContextMenu.Trigger>
      <ContextMenu.Content>{children}</ContextMenu.Content>
    </ContextMenu.Root>
  );
};

export const ContextMenuItem = ContextMenu.Item;
export const ContextMenuItemTitle = ContextMenu.ItemTitle;
export const ContextMenuItemIcon = ContextMenu.ItemIcon;
export const ContextMenuGroup = ContextMenu.Group;
export const ContextMenuSeparator = ContextMenu.Separator;

