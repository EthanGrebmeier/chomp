import { type ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

import { useSheetContentInset } from './sheet-content';
import { useSheetExit } from './sheet-exit-context';
import { SURFACE_INSETS, type SurfaceSpacing } from './surface-content';
import { CloseButton } from './ui/close-button';
import { Text } from './ui/text';

export type SheetHeaderProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Interactive heading, such as the composer mode menu. */
  centerContent?: ReactNode;
  /** Navigation to a previous step stays on the leading edge. */
  backAction?: ReactNode;
  /** Explicit dismissal preserves the caller's cancellation/save behavior. */
  closeAction?: ReactNode;
  /** Page actions only; sheet actions belong in the body or metabar. */
  primaryAction?: ReactNode;
  className?: string;
  spacing?: SurfaceSpacing;
};

export function SheetHeader({
  title,
  subtitle,
  centerContent,
  backAction,
  closeAction,
  primaryAction,
  className,
  spacing,
}: SheetHeaderProps) {
  const defaultExit = useSheetExit();
  const dismiss =
    closeAction ??
    (!backAction && defaultExit ? (
      <CloseButton onPress={defaultExit} />
    ) : undefined);
  const contentInset = useSheetContentInset();
  return (
    <View
      collapsable={false}
      className={cn('mb-4 gap-2', className)}
      style={{
        marginHorizontal: -contentInset,
        paddingHorizontal: spacing
          ? SURFACE_INSETS[spacing]
          : contentInset || SURFACE_INSETS.wide,
      }}
    >
      <View className="min-h-11 flex-row items-center gap-2">
        {backAction}
        <View className="min-w-0 flex-1">
          {centerContent ??
            (typeof title === 'string' ? (
              <Text
                accessibilityRole="header"
                numberOfLines={2}
                ellipsizeMode="tail"
                className="text-left text-lg font-medium leading-6"
              >
                {title}
              </Text>
            ) : (
              title
            ))}
        </View>
        {primaryAction}
        {dismiss}
      </View>
      {subtitle ? (
        <Text className="text-left text-sm leading-5 text-muted-foreground">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
