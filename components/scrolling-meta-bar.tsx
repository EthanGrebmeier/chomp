import { ScrollView, View } from 'react-native';

import { cn } from '../lib/utils';

type ScrollingMetaBarProps = {
  children: React.ReactNode;
  trailingInset?: number;
  className?: string;
  contentClassName?: string;
};

export const ScrollingMetaBar = ({
  children,
  trailingInset = 0,
  className,
  contentClassName,
}: ScrollingMetaBarProps) => {
  return (
    <View className={cn('-mx-4 flex-row items-center ', className)}>
      <ScrollView
        contentContainerStyle={
          trailingInset ? { paddingRight: trailingInset } : undefined
        }
        horizontal
        showsHorizontalScrollIndicator={false}
        className="min-h-8"
        contentContainerClassName={cn(
          'flex-row items-center gap-2 pl-4 pr-4 overflow-hidden ',
          contentClassName
        )}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        {children}
      </ScrollView>
    </View>
  );
};
