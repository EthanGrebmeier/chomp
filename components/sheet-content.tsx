import { createContext, useContext, type ComponentProps } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SurfaceContent,
  SurfaceContentRoot,
  SURFACE_INSETS,
  SURFACE_SECTION_GAP,
  SURFACE_HEADER_GAP,
  useContentInset,
} from './surface-content';

export const SHEET_CONTENT_INSET = SURFACE_INSETS.wide;
export const SHEET_VERTICAL_INSET = SURFACE_SECTION_GAP;
export const SHEET_HEADER_GAP = SURFACE_HEADER_GAP;
export const SHEET_TOP_STYLE = { paddingTop: SHEET_VERTICAL_INSET };
export const SHEET_CARD_STYLE = { paddingVertical: SHEET_VERTICAL_INSET };
export const SheetHasFooterContext = createContext(false);
export const useSheetContentInset = useContentInset;
export const SheetContentRoot = SurfaceContentRoot;

/** Sheets use the wide content gutter. */
export function SheetContent(props: ComponentProps<typeof View>) {
  return <SurfaceContent {...props} spacing="wide" />;
}

/** Terminal body owns one bottom gutter: safe-area clearance or visual spacing,
 * whichever is larger. A footer takes over that responsibility when present. */
export function SheetBody({ style, ...props }: ComponentProps<typeof View>) {
  const { bottom } = useSafeAreaInsets();
  const hasFooter = useContext(SheetHasFooterContext);
  return (
    <SheetContent
      {...props}
      style={[
        {
          paddingBottom: hasFooter ? 0 : Math.max(bottom, SHEET_VERTICAL_INSET),
        },
        style,
      ]}
    />
  );
}

/** Footer owns edge clearance once, including when rendered in a native portal. */
export function SheetFooter({ style, ...props }: ComponentProps<typeof View>) {
  const { bottom } = useSafeAreaInsets();
  return (
    <SheetContentRoot>
      <SheetContent
        {...props}
        style={[
          {
            paddingTop: SHEET_HEADER_GAP,
            paddingBottom: Math.max(bottom, SHEET_VERTICAL_INSET),
          },
          style,
        ]}
      />
    </SheetContentRoot>
  );
}
