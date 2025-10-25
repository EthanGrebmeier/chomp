import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, PressableProps, View } from 'react-native';

export type HapticPressableProps = PressableProps & {
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
  ref?: React.Ref<View | null>;
};

/**
 * A Pressable component that provides haptic feedback on press
 */
export const HapticPressable = ({
  haptic = true,
  hapticType = 'light',
  onPress,
  ref,
  ...props
}: HapticPressableProps) => {
  const handlePress = (event: any) => {
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

  return <Pressable onPress={handlePress} ref={ref} {...props} />;
};
