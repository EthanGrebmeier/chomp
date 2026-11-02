import { type ReactNode, useEffect } from 'react';
import { ScrollView } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { SheetBody, SheetFooter } from '@/components/sheet-content';
import { CloseButton } from '@/components/ui/close-button';

import type { useSheetController } from './use-sheet-controller';

export function Sheet({
  title,
  children,
  controller,
  button,
}: {
  title: string;
  children: ReactNode;
  controller: ReturnType<typeof useSheetController>;
  button?: ReactNode;
}) {
  const { ref, onDismiss } = controller;
  useEffect(() => {
    void ref.current?.present();
  }, [ref]);
  return (
    <BottomSheet
      ref={ref}
      // Full height keeps this sheet attached to the screen edges on iOS 26.
      detents={[1]}
      insetAdjustment="automatic"
      scrollable
      onDismiss={onDismiss}
      footer={button ? <SheetFooter>{button}</SheetFooter> : undefined}
    >
      <BottomSheet.Header
        title={title}
        closeAction={
          <CloseButton
            onPress={() => {
              void ref.current?.dismiss();
            }}
          />
        }
      />
      <ScrollView keyboardShouldPersistTaps="handled">
        <SheetBody className="gap-4">{children}</SheetBody>
      </ScrollView>
    </BottomSheet>
  );
}
