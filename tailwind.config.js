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
          DEFAULT: '#3949AB',
          2: '#5262C9',
          tint: '#EEF0FA',
        },
        accent: {
          DEFAULT: '#0F766E',
          tint: '#E3F4F1',
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
        card: '0 1px 2px rgb(25 32 80 / 0.05), 0 8px 24px rgb(57 73 171 / 0.07)',
        hero: '0 12px 28px rgb(57 73 171 / 0.28)',
        fab: '0 6px 16px rgb(15 118 110 / 0.35), 0 0 0 5px #FFFFFF',
        bnav: '0 -6px 20px rgb(57 73 171 / 0.06)',
      },
      minHeight: {
        tap: '48px',
      }
    },
  },
  plugins: [],
}
