import { ExternalLinkIcon } from 'lucide-react-native';

import {
  HeaderActionButton,
  type HeaderActionButtonProps,
} from './header-action';

type ExternalLinkButtonProps = Omit<
  HeaderActionButtonProps,
  'icon' | 'variant'
>;

export function ExternalLinkButton(props: ExternalLinkButtonProps) {
  return (
    <HeaderActionButton
      accessibilityLabel="View recipe"
      {...props}
      icon={ExternalLinkIcon}
      variant="ghost"
    />
  );
}
