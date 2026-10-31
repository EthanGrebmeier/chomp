import { X } from 'lucide-react-native';

import {
  HeaderActionButton,
  type HeaderActionButtonProps,
} from './header-action';

type CloseButtonProps = Omit<
  HeaderActionButtonProps,
  'icon' | 'variant' | 'iconSize' | 'iconAlignment' | 'iconLeadingInset'
>;

export const CloseButton = (props: CloseButtonProps) => {
  return (
    <HeaderActionButton
      accessibilityLabel="Close"
      {...props}
      icon={X}
      iconSize={20}
      variant="ghost"
    />
  );
};
