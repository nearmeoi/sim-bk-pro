import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import { registerSW } from 'virtual:pwa-register';
import MobileApp from './MobileApp';
import { BKProvider } from '../context/BKContext';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import ConfirmModal from '../components/ui/ConfirmModal';
import { ThemeProvider, applyTheme, loadThemePrefs } from './theme';

// PWA: daftarkan service worker yang sama dengan versi PC,
// supaya /m/ juga bisa dipasang ke layar utama ponsel.
registerSW({ immediate: true });

// Terapkan tema sebelum render pertama supaya tidak ada kedipan warna.
applyTheme(loadThemePrefs());

// Entry khusus /m/ — sengaja terpisah dari src/main.tsx supaya
// perubahan tampilan ponsel tidak pernah menyentuh bundel PC.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BKProvider>
          <MobileApp />
          <ConfirmModal />
        </BKProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
