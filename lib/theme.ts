import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
    background: 'hsl(14 33% 88%)',
    foreground: 'hsl(0 0% 0%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(0 0% 3.9%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(0 0% 3.9%)',
    primary: 'hsl(214 91% 45%)',
    primaryForeground: 'hsl(0 0% 98%)',
    secondary: 'hsl(0 0% 0.1%)',
    secondaryForeground: 'hsl(0 0% 100%)',
    muted: 'hsl(0 0% 96.1%)',
    mutedForeground: 'hsl(0 0% 45.1%)',
    accent: 'hsl(13 5% 90%)',
    accentForeground: 'hsl(200 20% 25%)',
    destructive: 'hsl(0 84.2% 60.2%)',
    border: 'hsl(20 40% 80%)',
    input: 'hsl(0 10% 92.8%)',
    ring: 'hsl(0 0% 63%)',
    radius: '0.625rem',
    chart1: 'hsl(12 76% 61%)',
    chart2: 'hsl(173 58% 39%)',
    chart3: 'hsl(197 37% 24%)',
    chart4: 'hsl(43 74% 66%)',
    chart5: 'hsl(27 87% 67%)',
  },
  dark: {
    background: 'hsl(257 6% 8%)',
    foreground: 'hsl(0 0% 98%)',
    card: 'hsl(237 6% 16%)',
    cardForeground: 'hsl(0 0% 98%)',
    popover: 'hsl(0 0% 3.9%)',
    popoverForeground: 'hsl(0 0% 98%)',
    primary: 'hsl(214 91% 45%)',
    primaryForeground: 'hsl(100 100% 100%)',
    secondary: 'hsl(0 0% 96%)',
    secondaryForeground: 'hsl(0 0% 0%)',
    muted: 'hsl(235 5% 18%)',
    mutedForeground: 'hsl(0 0% 63.9%)',
    accent: 'hsl(13 5% 35%)',
    accentForeground: 'hsl(0 50% 78%)',
    destructive: 'hsl(0 70.9% 59.4%)',
    border: 'hsl(216 8% 60% / 0.5)',
    input: 'hsl(234 8% 9.9%)',
    ring: 'hsl(300 0% 45%)',
    radius: '0.625rem',
    chart1: 'hsl(220 70% 50%)',
    chart2: 'hsl(160 60% 45%)',
    chart3: 'hsl(30 80% 55%)',
    chart4: 'hsl(280 65% 60%)',
    chart5: 'hsl(340 75% 55%)',
  },
};

export const ACCENT_COLORS = {
  purple: {
    background: '#ebceed',
    foreground: '#c71ad3',
  },
  blue: {
    background: '#e6f4fe',
    foreground: '#007aff',
  },
  green: {
    background: '#e6fee7',
    foreground: '#088e54',
  },
  orange: {
    background: '#ffe6d9',
    foreground: '#d97a08',
  },
  yellow: {
    background: '#fff9e6',
    foreground: '#d9a508',
  },
  red: {
    background: '#ffe6e6',
    foreground: '#d90808',
  },
  pink: {
    background: '#ffe6f0',
    foreground: '#d908d9',
  },
  brown: {
    background: '#f0e6e6',
    foreground: '#d97a08',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
