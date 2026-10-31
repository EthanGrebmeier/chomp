import { X } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { View } from 'react-native';

import { SheetHeader, type SheetHeaderProps } from '../sheet-header';
import {
  HeaderActionButton,
  type HeaderActionButtonProps,
} from '../ui/header-action';

export const COMPOSER_CARD_CLASS = 'rounded-[32px] border border-border py-2';
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
