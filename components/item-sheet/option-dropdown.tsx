import { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '../../lib/utils';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../native-dropdown';

type OptionDropdownProps = {
  children: ReactNode;
  triggerClassName?: string;
  label: string;
  value?: string | null;
  options: readonly { value: string; label: string }[];
  disabled?: boolean;
  onSelect: (value?: string) => void;
  onCreate?: () => void;
};

export const OptionDropdown = ({
  children,
  triggerClassName,
  label,
  value,
  options,
  disabled,
  onSelect,
  onCreate,
}: OptionDropdownProps) => (
  <DropdownMenuRoot>
    <DropdownMenuTrigger disabled={disabled}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Choose ${label}`}
        accessibilityState={{ disabled }}
        className={cn('min-h-11 justify-center', triggerClassName)}
      >
        {children}
      </View>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuCheckboxItem
        key="none"
        value={!value ? 'on' : 'off'}
        onValueChange={() => onSelect(undefined)}
      >
        <DropdownMenuItemTitle>None</DropdownMenuItemTitle>
      </DropdownMenuCheckboxItem>
      {options.map(option => (
        <DropdownMenuCheckboxItem
          key={`option:${option.value}`}
          value={value === option.value ? 'on' : 'off'}
          onValueChange={() => onSelect(option.value)}
        >
          <DropdownMenuItemTitle>{option.label}</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
      ))}
      {onCreate ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem key="create" onSelect={onCreate}>
            <DropdownMenuItemTitle>Create new {label}…</DropdownMenuItemTitle>
          </DropdownMenuItem>
        </>
      ) : null}
    </DropdownMenuContent>
  </DropdownMenuRoot>
);
