import { Href, router } from 'expo-router';
import { ChevronLeftIcon } from 'lucide-react-native';

import { cn } from '@/lib/utils';

import { Button } from './button';
import { CloseButton } from './close-button';
import { Icon } from './icon';

interface BackButtonProps {
  onPress?: () => void;
  className?: string;
  href?: Href;
  appearance?: 'close' | 'chevron';
}

export function BackButton({
  onPress,
  className,
  href,
  appearance = 'close',
}: BackButtonProps) {
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

  if (appearance === 'chevron') {
    return (
      <Button
        size="icon"
        variant="ghost"
        accessibilityLabel="Back"
        onPress={handlePress}
        className={cn('size-11', className)}
      >
        <Icon
          as={ChevronLeftIcon}
          size={24}
          strokeWidth={3.5}
          className="text-foreground"
        />
      </Button>
    );
  }

  return (
    <CloseButton
      accessibilityLabel="Back"
      onPress={handlePress}
      className={className}
    />
  );
}
