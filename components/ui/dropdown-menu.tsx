import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import { View } from 'react-native';
import * as DropdownMenu from 'zeego/dropdown-menu';

type DropdownMenuRootProps = {
  trigger: ReactNode;
  children: ReactNode;
};

export const DropdownMenuRoot = ({
  trigger,
  children,
}: DropdownMenuRootProps) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        onClick={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <View>{trigger}</View>
      </DropdownMenu.Trigger>
      {children}
    </DropdownMenu.Root>
  );
};

export const DropdownMenuContent = DropdownMenu.Content;
export const DropdownMenuItem = DropdownMenu.Item;
export const DropdownMenuItemTitle = DropdownMenu.ItemTitle;
export const DropdownMenuItemIcon = DropdownMenu.ItemIcon;
export const DropdownMenuGroup = DropdownMenu.Group;
