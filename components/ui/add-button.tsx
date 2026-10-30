import { PlusIcon } from 'lucide-react-native';

import {
  HeaderActionButton,
  type HeaderActionButtonProps,
} from './header-action';

type AddButtonProps = Omit<HeaderActionButtonProps, 'icon' | 'variant'>;

export const AddButton = (props: AddButtonProps) => (
  <HeaderActionButton
    accessibilityLabel="Add"
    {...props}
    icon={PlusIcon}
    variant="default"
  />
);
