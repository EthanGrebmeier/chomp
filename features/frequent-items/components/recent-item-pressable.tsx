import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { HapticPressable } from '@/components/ui/haptic-pressable';

type Props = {
  label: string;
  onAdd: () => Promise<void>;
  children: ReactNode;
};

/** Collapse native layout from the UI runtime without waiting for JS. */
export function RecentItemPressable({ label, onAdd, children }: Props) {
  const removed = useSharedValue(false);
  const style = useAnimatedStyle(() => ({
    // No exit transition: opacity alone would leave a gap. A single layout
    // update collapses variable-height rows, including enlarged text.
    display: removed.get() ? 'none' : 'flex',
  }));
  const commit = useCallback(async () => {
    void Haptics.selectionAsync();
    try {
      await onAdd();
    } catch {
      // The caller restores its pending-name filter and reports the failure.
      removed.set(false);
    }
  }, [onAdd, removed]);
  const activate = () => {
    if (removed.get()) return;
    removed.set(true);
    void commit();
  };
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(10)
        .onEnd((_event, success) => {
          if (!success || removed.get()) return;
          removed.set(true);
          scheduleOnRN(commit);
        }),
    [commit, removed]
  );
  if (Platform.OS === 'web') {
    return (
      <Animated.View style={style}>
        <HapticPressable
          accessibilityRole="button"
          accessibilityLabel={label}
          haptic={false}
          onPress={activate}
        >
          {children}
        </HapticPressable>
      </Animated.View>
    );
  }
  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={style}
        collapsable={false}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        onAccessibilityTap={activate}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={event => {
          if (event.nativeEvent.actionName === 'activate') activate();
        }}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
