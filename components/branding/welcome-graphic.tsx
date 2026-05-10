import { useColorScheme } from 'nativewind';

import WelcomeGraphicSvg from '@/assets/images/welcome-graphic.svg';

type WelcomeGraphicVariant = 'light' | 'dark';

type WelcomeGraphicProps = {
  width?: number;
  height?: number;
};

const GRAPHIC_COLOR_BY_VARIANT: Record<WelcomeGraphicVariant, string> = {
  light: '#3344E0',
  dark: '#EFE0B7',
};

export function WelcomeGraphic({
  width = 256,
  height = 283,
}: WelcomeGraphicProps) {
  const colorScheme = useColorScheme();
  const resolvedVariant = colorScheme.colorScheme === 'dark' ? 'dark' : 'light';
  const color = GRAPHIC_COLOR_BY_VARIANT[resolvedVariant];
  return <WelcomeGraphicSvg width={width} height={height} color={color} />;
}
