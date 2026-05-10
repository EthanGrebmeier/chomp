const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          purple: {
            background: '#c71ad320',
            foreground: '#c71ad3',
          },
          blue: {
            background: '#3344E0',
            foreground: '#1a1a1a',
          },
          green: {
            background: '#0ACE48',
            foreground: '#1a1a1a',
          },
          orange: {
            background: '#e0ae18',
            foreground: '#1a1a1a',
          },
          yellow: {
            background: '#F7BD0C',
            foreground: '#1a1a1a',
          },
          red: {
            background: '#e00909',
            foreground: '#EFE0B7',
          },
          gray: {
            background: '#dadadf',
            foreground: '#1a1a1a',
          },
          magenta: {
            background: '#BF00EA',
            foreground: '#1a1a1a',
          },
          pink: {
            background: '#FF2CBC',
            foreground: '#1a1a1a',
          },
          white: {
            background: '#ffffff',
            foreground: '#1a1a1a',
          },
          brown: {
            background: '#c4956a20',
            foreground: '#c4956a',
          },
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      fontFamily: {
        'jaro-regular': ['jaro-regular'],
        'averia-serif-libre': ['averia-serif-libre'],
        'alpino-regular': ['alpino-regular'],
        'alpino-medium': ['alpino-medium'],
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate')],
};
