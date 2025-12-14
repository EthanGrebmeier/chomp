import { PlusIcon } from 'lucide-react-native';

import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';

type CreateRecipeInlineButtonProps = {
  label: string;
  onPress: () => void;
};

export const CreateRecipeInlineButton = ({
  label,
  onPress,
}: CreateRecipeInlineButtonProps) => {
  return (
    <Button
      variant="outline"
      onPress={onPress}
      className="flex-row items-center gap-2"
    >
      <Icon
        as={PlusIcon}
        size={18}
        strokeWidth={2.5}
        className="text-foreground"
      />
      <Text>{label}</Text>
    </Button>
  );
};

