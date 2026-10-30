import { CheckIcon } from 'lucide-react-native';

import { HeaderActionButton } from './header-action';

interface ConfirmButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function ConfirmButton(props: ConfirmButtonProps) {
  return (
    <HeaderActionButton
      {...props}
      icon={CheckIcon}
      accessibilityLabel="Confirm"
      variant="default"
    />
  );
}
