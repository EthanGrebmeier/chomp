import { ReactNode } from 'react';
import { View } from 'react-native';

import {
  ComposerHeader,
  ComposerCloseButton,
  ComposerActionSlot,
  COMPOSER_CARD_CLASS,
} from '@/components/item-sheet/composer-layout';

import { MetaBarTrailingInsetContext } from '../meta-bar-insets';
import { SHEET_CONTENT_INSET, SheetContentRoot } from '../sheet-content';
import { SurfaceContent } from '../surface-content';

/** Compact form surface shared by grocery, ingredient, and meal-plan editors. */
export function ItemComposerCard({
  title,
  header,
  onClose,
  children,
  metadata,
  action,
}: {
  title: string;
  header?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  metadata: ReactNode;
  action?: ReactNode;
}) {
  return (
    <SheetContentRoot>
      <View
        collapsable={false}
        className={`overflow-hidden bg-background ${COMPOSER_CARD_CLASS}`}
      >
        <ComposerHeader
          className="mb-2"
          title={header ? undefined : title}
          centerContent={header}
          closeAction={
            <ComposerCloseButton
              onPress={onClose}
              accessibilityLabel={`Close ${title.toLowerCase()}`}
            />
          }
        />
        <SurfaceContent>
          <View className="gap-1">{children}</View>
          <View className="mt-3 min-h-11 flex-row items-center gap-2">
            <View className="min-w-0 flex-1">
              <MetaBarTrailingInsetContext.Provider
                value={action ? 0 : SHEET_CONTENT_INSET}
              >
                {metadata}
              </MetaBarTrailingInsetContext.Provider>
            </View>
            {action ? <ComposerActionSlot>{action}</ComposerActionSlot> : null}
          </View>
        </SurfaceContent>
      </View>
    </SheetContentRoot>
  );
}
