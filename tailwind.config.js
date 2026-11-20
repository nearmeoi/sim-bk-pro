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
        // Warna mengikuti variabel CSS supaya tema (aksen & mode gelap)
        // bisa diganti saat aplikasi berjalan. Kanal RGB dipakai agar
        // modifier opasitas Tailwind (mis. border-border/80) tetap jalan.
        primary: {
          DEFAULT: 'rgb(var(--primary-rgb) / <alpha-value>)',
          2: 'rgb(var(--primary-2-rgb) / <alpha-value>)',
          tint: 'var(--primary-tint)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          tint: 'var(--accent-tint)',
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
          DEFAULT: 'rgb(var(--alert-rgb) / <alpha-value>)',
          tint: 'var(--alert-tint)',
        },
        bg: 'var(--bg)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        text: 'rgb(var(--text-rgb) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
      },
      borderRadius: {
        rc: '20px',
        rx: '14px',
        panel: '28px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.03), 0 4px 12px rgb(0 0 0 / 0.06)',
        hero: '0 8px 24px rgb(var(--primary-rgb) / 0.2)',
        fab: '0 4px 12px rgb(var(--primary-rgb) / 0.3), 0 0 0 5px var(--bg)',
        bnav: '0 -4px 16px rgb(0 0 0 / 0.04)',
      },
      minHeight: {
        tap: '48px',
      }
    },
  },
  plugins: [],
}
