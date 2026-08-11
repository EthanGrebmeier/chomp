import { AveriaSerifLibre_400Regular } from '@expo-google-fonts/averia-serif-libre/400Regular';
import { Jaro_400Regular } from '@expo-google-fonts/jaro/400Regular';
import { useFonts } from 'expo-font';

export function useAppFonts() {
  return useFonts({
    'AveriaSerifLibre-Regular': AveriaSerifLibre_400Regular,
    'Jaro-Regular': Jaro_400Regular,
    'Alpino-Regular': require('../assets/fonts/alpino/Alpino-Regular.otf'),
    'Alpino-Medium': require('../assets/fonts/alpino/Alpino-Medium.otf'),
  });
}
