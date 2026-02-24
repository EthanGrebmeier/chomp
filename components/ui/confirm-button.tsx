import { CheckIcon } from 'lucide-react-native';

import { Button } from './button';
import { Icon } from './icon';

interface ConfirmButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function ConfirmButton({ onPress, disabled }: ConfirmButtonProps) {
  return (
    <Button
      size="icon"
      variant="default"
      onPress={onPress}
      disabled={disabled}
      hapticType="light"
    >
      <Icon
        className="text-primary-foreground"
        as={CheckIcon}
        strokeWidth={3}
        size={24}
      />
    </Button>
  );
}
