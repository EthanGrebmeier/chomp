import { ExternalLinkIcon } from 'lucide-react-native';

import { Button, type ButtonProps } from './button';
import { Icon } from './icon';

type ExternalLinkButtonProps = Omit<ButtonProps, 'variant' | 'children'>;

export function ExternalLinkButton(props: ExternalLinkButtonProps) {
  return (
    <Button variant="outline" size="icon" {...props}>
      <Icon as={ExternalLinkIcon} size={18} className="text-foreground" />
    </Button>
  );
}
