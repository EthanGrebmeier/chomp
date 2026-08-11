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
        // NativeWind does not resolve full OKLCH values stored in CSS variables
        // on native. These are sRGB fallbacks for the matching global.css tokens.
        category: {
          red: {
            foreground: {
              light: '#7C2524',
              dark: '#F1B2AC',
            },
            surface: {
              light: '#E3B8B4',
              dark: '#442321',
            },
            solid: {
              light: '#ED6862',
              dark: '#EF7F77',
            },
          },
          orange: {
            foreground: {
              light: '#663C1E',
              dark: '#F1B68E',
            },
            surface: {
              light: '#E3BBA0',
              dark: '#3A2A1F',
            },
            solid: {
              light: '#D77F3D',
              dark: '#E88A43',
            },
          },
          gold: {
            foreground: {
              light: '#54461E',
              dark: '#E3C05E',
            },
            surface: {
              light: '#D9C285',
              dark: '#332D1F',
            },
            solid: {
              light: '#B3953E',
              dark: '#C1A143',
            },
          },
          green: {
            foreground: {
              light: '#225426',
              dark: '#67E371',
            },
            surface: {
              light: '#8DDA8F',
              dark: '#213321',
            },
            solid: {
              light: '#45B34F',
              dark: '#4BC156',
            },
          },
          teal: {
            foreground: {
              light: '#22514E',
              dark: '#67DAD3',
            },
            surface: {
              light: '#8DD3CE',
              dark: '#213130',
            },
            solid: {
              light: '#45ABA5',
              dark: '#4BB9B2',
            },
          },
          blue: {
            foreground: {
              light: '#1F487B',
              dark: '#A7C7F0',
            },
            surface: {
              light: '#B1C6E2',
              dark: '#1F2F42',
            },
            solid: {
              light: '#5A9AEB',
              dark: '#70A7ED',
            },
          },
          purple: {
            foreground: {
              light: '#57298E',
              dark: '#CCB9F0',
            },
            surface: {
              light: '#C9BDE2',
              dark: '#33254A',
            },
            solid: {
              light: '#A87EEB',
              dark: '#B28FEE',
            },
          },
          pink: {
            foreground: {
              light: '#752451',
              dark: '#F1ADCC',
            },
            surface: {
              light: '#E3B5CA',
              dark: '#412231',
            },
            solid: {
              light: '#EE58A9',
              dark: '#EF73B3',
            },
          },
          contrast: {
            light: '#2E2E2E',
            dark: '#2E2E2E',
          },
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
        'jaro-regular': ['Jaro-Regular'],
        'averia-serif-libre': ['AveriaSerifLibre-Regular'],
        'alpino-regular': ['Alpino-Regular'],
        'alpino-medium': ['Alpino-Medium'],
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate')],
};
