import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

import { SHEET_ACTION_INSET, useSheetContentInset } from './sheet-content';
import { useSheetExit } from './sheet-exit-context';
import { CloseButton } from './ui/close-button';
import { CloseButtonAlignmentContext } from './ui/close-button-alignment';
import { Text } from './ui/text';

export type SheetHeaderProps = {
  /** A string, or an interactive title such as a mode menu. */
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Interactive content centered between the actions, above the stacked title. */
  centerContent?: ReactNode;
  backAction?: ReactNode;
  primaryAction?: ReactNode;
  className?: string;
};

/** Shared by native sheets and compact composer surfaces. Actions retain their
 * own handlers, accessibility labels, and pending/disabled state. */
export function SheetHeader({
  title,
  subtitle,
  centerContent,
  backAction,
  primaryAction,
  className,
}: SheetHeaderProps) {
  const defaultExit = useSheetExit();
  const leftAction =
    backAction ??
    (defaultExit ? <CloseButton onPress={defaultExit} /> : undefined);
  const contentInset = useSheetContentInset();
  const [leftWidth, setLeftWidth] = useState(44);
  const [rightWidth, setRightWidth] = useState(44);
  const inlineHeading = !leftAction;
  const hasHeading = Boolean(title) || Boolean(subtitle);
  const balanceActions = Boolean(centerContent);
  const sideWidth = Math.max(44, leftWidth, rightWidth);
  const heading = (
    <View className="min-w-0 flex-1 gap-1">
      {typeof title === 'string' ? (
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          ellipsizeMode="tail"
          className="text-left text-2xl font-semibold leading-8"
        >
          {title}
        </Text>
      ) : (
        title
      )}
      {subtitle ? (
        <Text className="text-left text-sm leading-5 text-muted-foreground">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
  return (
    <View
      collapsable={false}
      className={cn('mb-4 gap-2', className)}
      style={{
        marginHorizontal: -contentInset,
        paddingHorizontal: SHEET_ACTION_INSET,
      }}
    >
      {inlineHeading ? (
        <View
          className={cn(
            'min-h-11 flex-row items-center gap-2 pl-4',
            !primaryAction && 'pr-4'
          )}
        >
          <View className="min-w-0 flex-1 gap-1">
            {centerContent ? (
              <View collapsable={false} className="items-center">
                {centerContent}
              </View>
            ) : null}
            {hasHeading ? <View className="flex-row">{heading}</View> : null}
          </View>
          {primaryAction ? (
            <View className="min-w-11 items-end justify-center">
              {primaryAction}
            </View>
          ) : null}
        </View>
      ) : (
        <View className="min-h-11 flex-row items-center gap-2">
          <View
            style={balanceActions ? { width: sideWidth } : undefined}
            className="min-w-11 items-start justify-center"
          >
            <View
              onLayout={event => setLeftWidth(event.nativeEvent.layout.width)}
            >
              <CloseButtonAlignmentContext.Provider value="center">
                {leftAction}
              </CloseButtonAlignmentContext.Provider>
            </View>
          </View>
          {centerContent ? (
            <View
              collapsable={false}
              className="min-w-0 flex-1 items-center justify-center"
            >
              {centerContent}
            </View>
          ) : (
            <View className="flex-1" />
          )}
          <View
            style={balanceActions ? { width: sideWidth } : undefined}
            className="min-w-11 items-end justify-center"
          >
            <View
              onLayout={event => setRightWidth(event.nativeEvent.layout.width)}
            >
              {primaryAction}
            </View>
          </View>
        </View>
      )}
      {!inlineHeading && hasHeading ? (
        // Align text with the visible back/close glyph, inside its 44-point target.
        <View className="flex-row px-4">{heading}</View>
      ) : null}
    </View>
  );
}
