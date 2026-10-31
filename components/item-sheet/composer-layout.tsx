import { X } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { SHEET_TOP_STYLE } from '../sheet-content';
import { SheetHeader, type SheetHeaderProps } from '../sheet-header';
import {
  HeaderActionButton,
  type HeaderActionButtonProps,
} from '../ui/header-action';

export const COMPOSER_CARD_CLASS = 'rounded-[32px] border border-border py-2';
// Explicit values in both modes prevent floating card spacing from surviving
// a mode switch on the same native views. Keep inputs mounted to preserve focus.
export const composerSheetStyles = StyleSheet.create({
  floatingFrame: { paddingHorizontal: 8, paddingTop: 0, paddingBottom: 24 },
  nativeFrame: { paddingHorizontal: 0, paddingBottom: 0, ...SHEET_TOP_STYLE },
  floatingCard: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    borderRadius: 32,
    borderWidth: 1,
    paddingVertical: 8,
  },
  nativeCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 0,
    borderRadius: 0,
    borderWidth: 0,
    paddingVertical: 0,
  },
});

export const COMPOSER_CONTENT_CLASS = 'px-4';
export const COMPOSER_METADATA_CLASS =
  '-mx-4 mt-1 min-h-11 justify-center overflow-hidden px-4';
export const COMPOSER_ACTION_OVERLAY_CLASS =
  'absolute bottom-0 right-0 top-0 justify-center bg-background pl-2 pr-4';

export function ComposerHeader(props: Omit<SheetHeaderProps, 'spacing'>) {
  return <SheetHeader {...props} spacing="standard" />;
}

export function ComposerCloseButton(
  props: Omit<
    HeaderActionButtonProps,
    'icon' | 'iconSize' | 'iconAlignment' | 'iconLeadingInset' | 'variant'
  >
) {
  return (
    <HeaderActionButton {...props} icon={X} iconSize={20} variant="ghost" />
  );
}

export function ComposerActionSlot({ children }: { children: ReactNode }) {
  return (
    <View className="min-h-11 min-w-11 items-center justify-center bg-background px-0.5">
      {children}
    </View>
  );
}
