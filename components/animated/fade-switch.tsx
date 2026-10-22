import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { fadeIn, fadeOut } from './transitions';

type FadeSwitchProps = {
  /**
   * Identifies the current state. When it changes, the previous children fade
   * out while the new children fade in.
   */
  stateKey: string;
  children: React.ReactNode;
};

/**
 * Cross-fades between mutually exclusive states (loading → content → error).
 *
 * Each state renders in an absolutely-filled layer so the exiting layer does
 * not push the entering one around in the flex layout during the overlap.
 * The parent must have a defined size (e.g. `flex-1`).
 */
export const FadeSwitch = ({ stateKey, children }: FadeSwitchProps) => (
  <Animated.View
    key={stateKey}
    entering={fadeIn()}
    exiting={fadeOut}
    style={StyleSheet.absoluteFill}
  >
    {children}
  </Animated.View>
);
