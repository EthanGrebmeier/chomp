import { Href, router } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { HapticPressable } from './haptic-pressable';
import { Icon } from './icon';
import { Text } from './text';

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
    <HapticPressable
      onPress={handlePress}
      className={`flex-row items-center gap-2 px-4 ${className || ''}`}
      hapticType="light"
    >
      <Icon as={ArrowLeftIcon} size={20} />
      <Text className="text-lg font-medium text-foreground">Back</Text>
    </HapticPressable>
  );
}
