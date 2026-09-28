import { Trash2Icon } from 'lucide-react-native';

import { Button } from './button';
import { Icon } from './icon';

interface DeleteButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

/** Icon-only destructive action sized for sheet/screen header slots. */
export function DeleteButton({
  onPress,
  accessibilityLabel,
  disabled,
}: DeleteButtonProps) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onPress={onPress}
      disabled={disabled}
      hapticType="light"
      accessibilityLabel={accessibilityLabel}
      className="-mr-1.5"
    >
      <Icon
        className="text-destructive"
        as={Trash2Icon}
        strokeWidth={2.5}
        size={22}
      />
    </Button>
  );
}
