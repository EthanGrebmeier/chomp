import { PlusIcon } from 'lucide-react-native';

import { Button, ButtonProps } from './button';
import { Icon } from './icon';

type AddButtonProps = Omit<ButtonProps, 'size' | 'variant' | 'children'>;

/** Primary "+" action mounted in the top-right of sheet and screen headers. */
export const AddButton = (props: AddButtonProps) => {
  return (
    <Button size="icon" variant="default" {...props}>
      <Icon
        as={PlusIcon}
        size={24}
        strokeWidth={3}
        className="text-primary-foreground"
      />
    </Button>
  );
};
