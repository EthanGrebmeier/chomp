import { type ReactNode } from 'react';
import { View } from 'react-native';

import { SheetContentRoot } from './sheet-content';
import { SheetHeader, type SheetHeaderProps } from './sheet-header';

/** Full-width page inside a sheet or overlay. The host owns the grabber inset;
 * the shared header owns the action/title spacing and gap before the body.
 * Use SheetContent for padded body sections, keeping scroll viewports full-width.
 */
export function SheetPage({
  header,
  children,
}: {
  header: Omit<SheetHeaderProps, 'className'>;
  children: ReactNode;
}) {
  return (
    <SheetContentRoot>
      <View className="min-h-0 flex-1 bg-background">
        <SheetHeader {...header} />
        {children}
      </View>
    </SheetContentRoot>
  );
}
