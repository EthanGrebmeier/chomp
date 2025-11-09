import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  GestureResponderEvent,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

export type HapticTouchableOpacityProps = TouchableOpacityProps & {
  /**
   * Whether to trigger haptic feedback on press
   * @default true
   */
  haptic?: boolean;
  /**
   * The type of haptic feedback to trigger
   * @default 'light'
   */
  hapticType?:
    | 'light'
    | 'medium'
    | 'heavy'
    | 'selection'
    | 'impact'
    | 'notification';
};

/**
 * A TouchableOpacity component that provides haptic feedback on press
 */
export const HapticTouchableOpacity = ({
  haptic = true,
  hapticType = 'light',
  onPress,
  ...props
}: HapticTouchableOpacityProps) => {
  const handlePress = (event: GestureResponderEvent) => {
    if (haptic) {
      // Trigger haptic feedback
      switch (hapticType) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
        case 'impact':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'notification':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    // Call the original onPress handler
    onPress?.(event);
  };

  return <TouchableOpacity onPress={handlePress} {...props} />;
};
