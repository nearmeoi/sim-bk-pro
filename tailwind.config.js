/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#B45309',
          2: '#92400E',
          tint: '#FEF3E2',
        },
        accent: {
          DEFAULT: '#E86A33',
          tint: '#FFE8D9',
          50: '#FFF7F0',
          100: '#FFF0E6',
          200: '#FFE1CC',
          300: '#FFC7A8',
          400: '#FFA47A',
          500: '#E86A33',
          600: '#C45224',
          700: '#96411B',
          800: '#6D3013',
          900: '#47200C',
        },
        alert: {
          DEFAULT: '#B91C1C',
          tint: '#FCE9E9',
        },
        bg: '#FFFFFF',
        surface: '#FFFFFF',
        border: '#E8EBF3',
        text: '#1B2236',
        muted: '#667085',
      },
      borderRadius: {
        rc: '20px',
        rx: '14px',
        panel: '28px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(55 35 15 / 0.05), 0 8px 24px rgb(232 106 51 / 0.07)',
        hero: '0 12px 28px rgb(232 106 51 / 0.28)',
        fab: '0 6px 16px rgb(232 106 51 / 0.35), 0 0 0 5px #FFFFFF',
        bnav: '0 -6px 20px rgb(232 106 51 / 0.06)',
      },
      minHeight: {
        tap: '48px',
      }
    },
  },
  plugins: [],
}
