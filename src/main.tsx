import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// PWA: daftarkan service worker agar aplikasi bisa dipasang ke layar utama HP
registerSW({ immediate: true })

// Self-check logika murni — hanya saat mode pengembangan
if (import.meta.env.DEV) {
  void import('./lib/selfcheck').then((m) => m.runSelfChecks())
}

if (typeof window !== 'undefined') {
  let originalTitle = document.title;
  window.addEventListener('beforeprint', () => {
    originalTitle = document.title;
    document.title = '';
  });
  window.addEventListener('afterprint', () => {
    document.title = originalTitle || 'SIM-BK';
  });
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
