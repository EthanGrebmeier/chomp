import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { HapticPressable } from './haptic-pressable';

type Props = ViewProps & {
  checked: boolean;
  animatedChecked: SharedValue<boolean>;
  onChange: (checked: boolean) => void;
  onLongPress?: () => void;
  disabled?: boolean;
};

/** Start toggle feedback on the UI runtime, even while JS is saving prior taps. */
export function TogglePressable({
  checked,
  animatedChecked,
  onChange,
  onLongPress,
  disabled = false,
  children,
  ...props
}: Props) {
  const commit = useCallback(
    (next: boolean) => {
      void Haptics.selectionAsync();
      onChange(next);
    },
    [onChange]
  );
  const activate = () => {
    if (disabled) return;
    const next = !animatedChecked.get();
    animatedChecked.set(next);
    commit(next);
  };
  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .enabled(!disabled)
      .maxDistance(10)
      .onEnd((_event, success) => {
        if (!success) return;
        const next = !animatedChecked.get();
        animatedChecked.set(next);
        scheduleOnRN(commit, next);
      });
    if (!onLongPress) return tap;
    const longPress = Gesture.LongPress()
      .enabled(!disabled)
      .minDuration(200)
      .maxDistance(10)
      .onStart(() => {
        scheduleOnRN(onLongPress);
      });
    return Gesture.Exclusive(longPress, tap);
  }, [animatedChecked, commit, disabled, onLongPress]);

  const accessibility = {
    accessibilityRole: 'checkbox' as const,
    accessibilityState: { checked, disabled },
  };
  if (Platform.OS === 'web') {
    return (
      <HapticPressable
        {...props}
        {...accessibility}
        disabled={disabled}
        haptic={false}
        onPress={activate}
        onLongPress={onLongPress}
        delayLongPress={200}
      >
        {children}
      </HapticPressable>
    );
  }
  return (
    <GestureDetector gesture={gesture}>
      <View
        {...props}
        {...accessibility}
        accessible
        collapsable={false}
        onAccessibilityTap={activate}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={event => {
          if (event.nativeEvent.actionName === 'activate') activate();
        }}
      >
        {children}
      </View>
    </GestureDetector>
  );
}
