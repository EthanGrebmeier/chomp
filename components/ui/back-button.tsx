import { Href, router } from 'expo-router';
import { ChevronLeftIcon } from 'lucide-react-native';

import { Button } from './button';
import { Icon } from './icon';

interface BackButtonProps {
  onPress?: () => void;
  className?: string;
  href?: Href;
}

export function BackButton({ onPress, className, href }: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      if (href) {
        router.dismissTo(href);
      } else {
        router.back();
      }
    }
  };

  return (
    <Button
      size="icon"
      variant="secondary"
      onPress={handlePress}
      hapticType="light"
    >
      <Icon as={ChevronLeftIcon} strokeWidth={3.5} size={20} />
    </Button>
  );
}
