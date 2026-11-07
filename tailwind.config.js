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
          DEFAULT: '#FFA36C',
          2: '#FF8A3D',
          tint: '#FFF5ED',
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
        border: '#E8E8E8',
        text: '#2D3748',
        muted: '#666666',
      },
      borderRadius: {
        rc: '20px',
        rx: '14px',
        panel: '28px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.03), 0 4px 12px rgb(0 0 0 / 0.06)',
        hero: '0 8px 24px rgb(255 163 108 / 0.2)',
        fab: '0 4px 12px rgb(255 163 108 / 0.3), 0 0 0 5px #FFFFFF',
        bnav: '0 -4px 16px rgb(0 0 0 / 0.04)',
      },
      minHeight: {
        tap: '48px',
      }
    },
  },
  plugins: [],
}
