import { useColorScheme } from 'nativewind';
import { THEME } from '../lib/theme';

export const useTheme = () => {
  const colorscheme = useColorScheme();
  return colorscheme.colorScheme === 'dark' ? THEME.dark : THEME.light;
};
