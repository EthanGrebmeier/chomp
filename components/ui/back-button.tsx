import { type Href, router } from 'expo-router';
import { ChevronLeftIcon } from 'lucide-react-native';

import {
  HeaderActionButton,
  type HeaderActionButtonProps,
} from './header-action';

type BackButtonProps = Omit<
  HeaderActionButtonProps,
  | 'icon'
  | 'iconSize'
  | 'iconAlignment'
  | 'iconLeadingInset'
  | 'variant'
  | 'onPress'
> & {
  onPress?: () => void;
  href?: Href;
};

/** Returns to a parent screen or an earlier step; use CloseButton to dismiss. */
export function BackButton({ onPress, href, ...props }: BackButtonProps) {
  return (
    <HeaderActionButton
      accessibilityLabel="Back"
      {...props}
      icon={ChevronLeftIcon}
      iconSize={24}
      iconAlignment="leading"
      iconLeadingInset={7.5}
      variant="ghost"
      onPress={() => {
        if (onPress) onPress();
        else if (href) router.dismissTo(href);
        else router.back();
      }}
    />
  );
}
