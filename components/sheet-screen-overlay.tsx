import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import {
  sheetScreenEnter,
  sheetScreenExit,
  sheetScreenFadeIn,
  sheetScreenFadeOut,
} from './animated/sheet-motion';

/** A deeper step in the current sheet: enter from the right, return to the right.
 * Reanimated retains the departing view for its exit; callers own the back action.
 */
export function SheetScreenOverlay({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      collapsable={false}
      style={StyleSheet.absoluteFill}
      className="overflow-hidden bg-background"
      entering={reducedMotion ? sheetScreenFadeIn : sheetScreenEnter}
      exiting={reducedMotion ? sheetScreenFadeOut : sheetScreenExit}
    >
      {children}
    </Animated.View>
  );
}
