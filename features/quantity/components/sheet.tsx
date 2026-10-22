import { type ReactNode, useEffect } from 'react';
import { ScrollView } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { BackButton } from '@/components/ui/back-button';

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
    <BottomSheet ref={ref} detents={[0.85]} scrollable onDismiss={onDismiss}>
      <BottomSheet.Header
        className="px-4"
        title={title}
        dismissButton={
          <BackButton
            onPress={() => {
              void ref.current?.dismiss();
            }}
          />
        }
        button={button}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        {children}
      </ScrollView>
    </BottomSheet>
  );
}
