import { X } from 'lucide-react-native';

import { Button, ButtonProps } from './button';
import { Icon } from './icon';

type CloseButtonProps = Omit<ButtonProps, 'size' | 'variant' | 'children'>;

export const CloseButton = (props: CloseButtonProps) => {
  return (
    <Button size="icon" variant="secondary" {...props}>
      <Icon as={X} size={20} className="text-secondary-foreground" />
    </Button>
  );
};
