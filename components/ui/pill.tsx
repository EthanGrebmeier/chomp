import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './text';

type PillProps = {
  children: ReactNode;
  onClear?: () => void;
  className?: string;
  icon?: ReactNode;
  hasValue?: boolean;
};

export const Pill = ({
  children,
  onClear,
  className,
  icon,
  hasValue = false,
}: PillProps) => {
  return (
    <View className="self-start">
      <View
        className={cn(
          'flex-row items-center gap-2 rounded-full border border-border px-2 py-1',
          hasValue && onClear && 'pr-8',
          className
        )}
      >
        {icon}
        <Text
          className={cn(
            'text-sm font-medium',
            hasValue ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {children}
        </Text>
      </View>
      {hasValue && onClear && (
        <Pressable
          onPress={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <XIcon color="black" size={16} />
        </Pressable>
      )}
    </View>
  );
};
