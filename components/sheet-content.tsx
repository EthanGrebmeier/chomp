import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SHEET_CONTENT_INSET = 32;
export const SHEET_ACTION_INSET = 16;
export const SHEET_VERTICAL_INSET = 24;
export const SHEET_HEADER_GAP = 16;
export const SHEET_TOP_STYLE = { paddingTop: SHEET_VERTICAL_INSET };
export const SHEET_CARD_STYLE = { paddingVertical: SHEET_VERTICAL_INSET };
export const SheetHasFooterContext = createContext(false);
const SheetContentInsetContext = createContext(0);
export const useSheetContentInset = () => useContext(SheetContentInsetContext);

/** Shared content edge; headers inside this container account for its inset. */
export function SheetContent({
  style,
  children,
  ...props
}: ComponentProps<typeof View>) {
  return (
    <SheetContentInsetContext.Provider value={SHEET_CONTENT_INSET}>
      <View
        {...props}
        style={[{ paddingHorizontal: SHEET_CONTENT_INSET }, style]}
      >
        {children}
      </View>
    </SheetContentInsetContext.Provider>
  );
}

/** A native sheet starts a new coordinate space, even when opened from another sheet. */
export function SheetContentRoot({ children }: { children: ReactNode }) {
  return (
    <SheetContentInsetContext.Provider value={0}>
      {children}
    </SheetContentInsetContext.Provider>
  );
}

/** Terminal body of an auto-sized sheet. Sections use SheetContent instead. */
export function SheetBody({ style, ...props }: ComponentProps<typeof View>) {
  const { bottom } = useSafeAreaInsets();
  const hasFooter = useContext(SheetHasFooterContext);
  return (
    <SheetContent
      {...props}
      style={[
        { paddingBottom: hasFooter ? 0 : bottom + SHEET_VERTICAL_INSET },
        style,
      ]}
    />
  );
}

/** Footer owns its edge padding, including when rendered in a native portal. */
export function SheetFooter({ style, ...props }: ComponentProps<typeof View>) {
  const { bottom } = useSafeAreaInsets();
  return (
    <SheetContentRoot>
      <SheetContent
        {...props}
        style={[
          {
            paddingTop: SHEET_HEADER_GAP,
            paddingBottom: bottom + SHEET_VERTICAL_INSET,
          },
          style,
        ]}
      />
    </SheetContentRoot>
  );
}
