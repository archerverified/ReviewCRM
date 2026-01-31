import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Clay-inspired grayscale palette (primary UI)
        clay: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E8E8E8',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Status colors with bg, text, and dot variants
        status: {
          green: {
            bg: '#DCFCE7',
            text: '#166534',
            dot: '#22C55E',
          },
          blue: {
            bg: '#DBEAFE',
            text: '#1E40AF',
            dot: '#3B82F6',
          },
          yellow: {
            bg: '#FEF9C3',
            text: '#A16207',
            dot: '#F59E0B',
          },
          red: {
            bg: '#FEE2E2',
            text: '#DC2626',
            dot: '#EF4444',
          },
          gray: {
            bg: '#F3F4F6',
            text: '#4B5563',
            dot: '#6B7280',
          },
          purple: {
            bg: '#F3E8FF',
            text: '#7C3AED',
            dot: '#A855F7',
          },
          orange: {
            bg: '#FFEDD5',
            text: '#C2410C',
            dot: '#F97316',
          },
        },
        // Purple accent for AI/enriched features
        purple: {
          light: '#F3E8FF',
          main: '#A855F7',
          dark: '#7C3AED',
          bg: '#FAF5FF',
        },
        // Green accent
        green: {
          light: '#DCFCE7',
          main: '#22C55E',
          dark: '#16A34A',
          bg: '#F0FDF4',
        },
        // Orange accent
        orange: {
          light: '#FFEDD5',
          main: '#F97316',
          dark: '#EA580C',
          bg: '#FFF7ED',
        },
        // Blue accent
        blue: {
          light: '#DBEAFE',
          main: '#3B82F6',
          dark: '#2563EB',
          bg: '#EFF6FF',
        },
        // Red accent
        red: {
          light: '#FEE2E2',
          main: '#EF4444',
          dark: '#DC2626',
        },
        // Alternating table row color
        row: {
          alt: '#FEF7F7',
        },
        // Stage colors for pipeline
        stage: {
          cold: '#6B7280',
          warm: '#F59E0B',
          dnr: '#EF4444',
          closed: '#22C55E',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      boxShadow: {
        'clay': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'clay-md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'clay-lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'context': '0 4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
