/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vq: {
          paper: '#F3EEE2',
          vellum: '#EAE3D2',
          card: '#FAF6EC',
          ink: '#1B1915',
          soft: '#4A463D',
          muted: '#6A6558',
          line: '#D6CDB9',
          red: '#9B3A22',
          night: '#15130E',
          bone: '#F3EEE2',
          ash: '#B4AD9D',
        },
        vorq: {
          ink: '#111827',
          slate: '#475569',
          canvas: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          primary: {
            DEFAULT: '#2563EB',
            50: '#EFF6FF',
            100: '#DBEAFE',
            500: '#3B82F6',
            600: '#2563EB',
            700: '#1D4ED8',
          },
          success: {
            DEFAULT: '#15803D',
            50: '#F0FDF4',
            100: '#DCFCE7',
            600: '#16A34A',
            700: '#15803D',
          },
          warning: {
            DEFAULT: '#B45309',
            50: '#FFFBEB',
            100: '#FEF3C7',
            600: '#D97706',
            700: '#B45309',
          },
          danger: {
            DEFAULT: '#B91C1C',
            50: '#FEF2F2',
            100: '#FEE2E2',
            600: '#DC2626',
            700: '#B91C1C',
          },
          disabled: '#94A3B8',
        }
      },
      borderRadius: {
        'vorq': '10px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Libre Caslon Display"', '"Libre Caslon Text"', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
};
