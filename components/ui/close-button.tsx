import { X } from 'lucide-react-native';
import { useContext } from 'react';

import { CloseButtonAlignmentContext } from './close-button-alignment';
import {
  HeaderActionButton,
  type HeaderActionButtonProps,
} from './header-action';

type CloseButtonProps = Omit<
  HeaderActionButtonProps,
  'icon' | 'variant' | 'iconSize' | 'iconAlignment'
>;

export const CloseButton = (props: CloseButtonProps) => {
  const alignment = useContext(CloseButtonAlignmentContext);
  return (
    <HeaderActionButton
      accessibilityLabel="Close"
      {...props}
      icon={X}
      iconSize={20}
      iconAlignment={alignment}
      variant="ghost"
    />
  );
};
