import { router } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { Icon } from './icon';
import { Text } from './text';

interface BackButtonProps {
  onPress?: () => void;
  className?: string;
}

export function BackButton({ onPress, className }: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center gap-2 px-4 ${className || ''}`}
    >
      <Icon as={ArrowLeftIcon} size={16} />
      <Text className="text-sm font-medium text-foreground">Back</Text>
    </Pressable>
  );
}
