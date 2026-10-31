import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { View } from 'react-native';

/** Outer gutters, not padding inside inputs, cards, or rows. */
export const SURFACE_INSETS = { standard: 16, wide: 32 } as const;
export type SurfaceSpacing = keyof typeof SURFACE_INSETS;
export const SURFACE_PAGE_TOP = 8;
export const SURFACE_SECTION_GAP = 24;
export const SURFACE_HEADER_GAP = 16;
const ContentInsetContext = createContext(0);
export const useContentInset = () => useContext(ContentInsetContext);

export function SurfaceContent({
  spacing = 'standard',
  style,
  ...props
}: ComponentProps<typeof View> & { spacing?: SurfaceSpacing }) {
  const inset = SURFACE_INSETS[spacing];
  return (
    <ContentInsetContext.Provider value={inset}>
      <View {...props} style={[{ paddingHorizontal: inset }, style]} />
    </ContentInsetContext.Provider>
  );
}

/** Reset at a new native surface or a full-width page boundary. */
export function SurfaceContentRoot({ children }: { children: ReactNode }) {
  return (
    <ContentInsetContext.Provider value={0}>
      {children}
    </ContentInsetContext.Provider>
  );
}
