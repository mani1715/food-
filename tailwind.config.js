/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        monochrome: {
          950: '#050505',
          900: '#0A0A0A',
          850: '#121212',
          800: '#181818',
          700: '#27272A',
          600: '#52525B',
          500: '#71717A',
          400: '#A1A1AA',
          300: '#D4D4D8',
          200: '#E5E5E5',
          100: '#F4F4F5',
          50: '#FAFAFA',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'elevated': '0 12px 32px -4px rgba(0, 0, 0, 0.08)',
        'modal': '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.25)',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}
