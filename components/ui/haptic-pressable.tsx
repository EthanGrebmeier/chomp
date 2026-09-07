import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import {
  Pressable as GesturePressable,
  PressableProps as GesturePressableProps,
} from 'react-native-gesture-handler';

type HapticProps = {
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

export type HapticPressableProps = PressableProps &
  HapticProps & {
    ref?: React.Ref<View | null>;
  };

export type GestureHapticPressableProps = GesturePressableProps &
  HapticProps & {
    ref?: React.Ref<View | null>;
  };

const triggerHaptic = (hapticType: NonNullable<HapticProps['hapticType']>) => {
  switch (hapticType) {
    case 'light':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'selection':
      void Haptics.selectionAsync();
      break;
    case 'impact':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'notification':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
  }
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
  const handlePress: NonNullable<PressableProps['onPress']> = event => {
    if (haptic) {
      triggerHaptic(hapticType);
    }

    onPress?.(event);
  };

  return <Pressable onPress={handlePress} ref={ref} {...props} />;
};

/**
 * Gesture-backed variant for press targets nested inside native pagers.
 */
export const GestureHapticPressable = ({
  haptic = true,
  hapticType = 'light',
  onPress,
  ref,
  ...props
}: GestureHapticPressableProps) => {
  const handlePress: NonNullable<GesturePressableProps['onPress']> = event => {
    if (haptic) {
      triggerHaptic(hapticType);
    }

    onPress?.(event);
  };

  return <GesturePressable onPress={handlePress} ref={ref} {...props} />;
};
