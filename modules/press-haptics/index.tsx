import { requireNativeView, requireOptionalNativeModule } from 'expo';
import { Platform, View, type ViewProps } from 'react-native';

// Older installed binaries can still open an OTA containing this component.
// They keep JS feedback until rebuilt with the local module.
export const hasNativePressHaptics =
  Platform.OS !== 'web' && requireOptionalNativeModule('PressHaptics') !== null;

export const PressHapticsView = hasNativePressHaptics
  ? requireNativeView<ViewProps>('PressHaptics')
  : View;
