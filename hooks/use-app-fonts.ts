import { useFonts } from 'expo-font';

/** Build 50 predates native embedding of the Alpino fonts. Ship them as OTA assets. */
export function useAppFonts(): readonly [boolean, Error | null] {
  return useFonts({
    'Alpino-Regular': require('../assets/fonts/alpino/Alpino-Regular.otf'),
    'Alpino-Medium': require('../assets/fonts/alpino/Alpino-Medium.otf'),
  });
}
