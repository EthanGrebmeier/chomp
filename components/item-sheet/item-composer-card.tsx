import { ReactNode } from 'react';
import { View } from 'react-native';

import { MetaBarTrailingInsetContext } from '../meta-bar-insets';
import {
  SHEET_CARD_STYLE,
  SHEET_CONTENT_INSET,
  SheetContent,
  SheetContentRoot,
} from '../sheet-content';
import { SheetHeader } from '../sheet-header';
import { CloseButton } from '../ui/close-button';

/** Compact form surface shared by grocery, ingredient, and meal-plan editors. */
export function ItemComposerCard({
  title,
  header,
  headerActions,
  onClose,
  children,
  metadata,
  action,
}: {
  title: string;
  header?: ReactNode;
  headerActions?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  metadata: ReactNode;
  action?: ReactNode;
}) {
  return (
    <SheetContentRoot>
      <View
        collapsable={false}
        className="overflow-hidden rounded-[32px] border border-border bg-background"
        style={SHEET_CARD_STYLE}
      >
        <SheetHeader
          title={header ? undefined : title}
          centerContent={header}
          backAction={
            <CloseButton
              onPress={onClose}
              accessibilityLabel={`Close ${title.toLowerCase()}`}
            />
          }
          primaryAction={headerActions}
        />
        <SheetContent>
          <View>{children}</View>
          <View className="mt-1 min-h-11 flex-row items-center gap-2">
            <View className="min-w-0 flex-1">
              <MetaBarTrailingInsetContext.Provider
                value={action ? 0 : SHEET_CONTENT_INSET}
              >
                {metadata}
              </MetaBarTrailingInsetContext.Provider>
            </View>
            {action}
          </View>
        </SheetContent>
      </View>
    </SheetContentRoot>
  );
}
