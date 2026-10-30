import { Trash2Icon } from 'lucide-react-native';

import { HeaderActionButton } from './header-action';

interface DeleteButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export function DeleteButton(props: DeleteButtonProps) {
  return (
    <HeaderActionButton
      {...props}
      icon={Trash2Icon}
      iconClassName="text-destructive"
    />
  );
}
