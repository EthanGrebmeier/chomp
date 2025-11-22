import { Href, router } from 'expo-router';
import { ChevronLeftIcon } from 'lucide-react-native';

import { cn } from '../../lib/utils';

import { HapticTouchableOpacity } from './haptic-touchable-opacity';
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
    <HapticTouchableOpacity
      onPress={handlePress}
      className={cn(
        ' flex-row items-center gap-2 rounded-full bg-muted p-2',
        className
      )}
      hapticType="light"
    >
      <Icon as={ChevronLeftIcon} strokeWidth={3.5} size={20} />
    </HapticTouchableOpacity>
  );
}
