import { ScrollView, View } from 'react-native';

import { cn } from '../lib/utils';

type ScrollingMetaBarProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export const ScrollingMetaBar = ({
  children,
  className,
  contentClassName,
}: ScrollingMetaBarProps) => {
  return (
    <View className={cn('-mx-4 flex-row items-center', className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="min-h-10"
        contentContainerClassName={cn(
          'flex-row items-center gap-2 pl-4 pr-2 overflow-hidden',
          contentClassName
        )}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
};
