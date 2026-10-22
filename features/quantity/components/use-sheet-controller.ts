import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useRef } from 'react';

/** Finish the native dismissal before unmounting or presenting the next sheet. */
export function useSheetController(onDismiss: () => void) {
  const ref = useRef<TrueSheet>(null);
  const afterDismiss = useRef<(() => void) | undefined>(undefined);
  return {
    ref,
    dismiss: (after?: () => void) => {
      afterDismiss.current = after;
      return ref.current?.dismiss();
    },
    onDismiss: () => {
      const after = afterDismiss.current;
      afterDismiss.current = undefined;
      onDismiss();
      after?.();
    },
  };
}
