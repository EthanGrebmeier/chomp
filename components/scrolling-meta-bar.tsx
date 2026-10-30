import { useContext } from 'react';
import { ScrollView, View } from 'react-native';

import { cn } from '../lib/utils';

import { MetaBarTrailingInsetContext } from './meta-bar-insets';
import { SHEET_CONTENT_INSET } from './sheet-content';

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
  const edgeInset = useContext(MetaBarTrailingInsetContext);
  return (
    <View
      className={cn('flex-row items-center', className)}
      style={{ marginLeft: -SHEET_CONTENT_INSET, marginRight: -edgeInset }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingLeft: SHEET_CONTENT_INSET,
          paddingRight: Math.max(edgeInset, trailingInset),
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="min-h-8 flex-1"
        contentContainerClassName={cn(
          'flex-row items-center gap-2',
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
