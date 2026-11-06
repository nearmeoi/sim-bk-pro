import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import CatatModal from './components/ui/CatatModal';
import Toast from './components/ui/Toast';
import BerandaView from './components/views/BerandaView';
import SiswaView from './components/views/SiswaView';
import AKPDView from './components/views/AKPDView';
import BimbinganKarirView from './components/views/BimbinganKarirView';
import DokumenView from './components/views/DokumenView';
import PengaturanView from './components/views/PengaturanView';
import ProfilView from './components/views/ProfilView';
import LoginView from './components/views/LoginView';
import NotFoundView from './components/views/NotFoundView';
import { BKProvider, useBK } from './context/BKContext';
import { NavView } from './types';

const VALID_VIEWS: NavView[] = [
  'beranda',
  'siswa',
  'akpd',
  'karir',
  'shinro',
  'dokumen',
  'pengaturan',
  'profil',
  'login',
  '404',
];

function AppContent() {
  const { isAuthenticated } = useBK();
  const [view, setView] = useState<NavView>('beranda');
  const [catatOpen, setCatatOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(null);
    requestAnimationFrame(() => setToast(msg));
  }, []);

  const navigate = useCallback((v: NavView) => {
    const target = v === 'shinro' ? 'karir' : v;
    setView(target);
    window.location.hash = target;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const rawHash = window.location.hash.replace('#', '');
    if (!rawHash) {
      setView('beranda');
      return;
    }
    const hash = rawHash as NavView;
    if (VALID_VIEWS.includes(hash)) {
      setView(hash === 'shinro' ? 'karir' : hash);
    } else {
      setView('404');
    }

    const fn = () => {
      const currentRaw = window.location.hash.replace('#', '');
      if (!currentRaw) {
        setView('beranda');
        return;
      }
      const v = currentRaw as NavView;
      if (VALID_VIEWS.includes(v)) {
        setView(v === 'shinro' ? 'karir' : v);
      } else {
        setView('404');
      }
    };
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);

  // If user is not authenticated or explicitly at login screen
  if (!isAuthenticated || view === 'login') {
    return (
      <div className="min-h-screen bg-bg">
        <LoginView onSuccess={() => navigate('beranda')} onToast={showToast} />
        <Toast message={toast} />
      </div>
    );
  }

  // 404 Not Found Page
  if (view === '404') {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <Sidebar current={view} onNav={navigate} onCatat={() => setCatatOpen(true)} />
        <main className="lg:pl-[248px] flex-1 flex items-center justify-center p-4">
          <NotFoundView onNav={navigate} />
        </main>
        <BottomNav current={view} onNav={navigate} onCatat={() => setCatatOpen(true)} />
        <Toast message={toast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar current={view} onNav={navigate} onCatat={() => setCatatOpen(true)} />

      <main className="lg:pl-[248px] print:!pl-0 print:!p-0 print:!m-0">
        <div className="max-w-[960px] mx-auto px-4 py-5 pb-32 lg:px-8 lg:py-8 lg:pb-12 print:!max-w-none print:!p-0 print:!m-0">
          {view === 'beranda' && (
            <BerandaView onNav={navigate} onCatat={() => setCatatOpen(true)} onToast={showToast} />
          )}
          {view === 'siswa' && <SiswaView onToast={showToast} />}
          {view === 'akpd' && <AKPDView onNav={navigate} onToast={showToast} />}
          {(view === 'karir' || view === 'shinro') && (
            <BimbinganKarirView onNav={navigate} onToast={showToast} />
          )}
          {view === 'dokumen' && <DokumenView onNav={navigate} onToast={showToast} />}
          {view === 'pengaturan' && <PengaturanView onToast={showToast} />}
          {view === 'profil' && <ProfilView onNav={navigate} onToast={showToast} />}
        </div>
      </main>

      <BottomNav current={view} onNav={navigate} onCatat={() => setCatatOpen(true)} />

      <CatatModal
        open={catatOpen}
        onClose={() => setCatatOpen(false)}
        onSelect={(jenis) => showToast(jenis)}
      />

      <Toast message={toast} />
    </div>
  );
}

export default function App() {
  return (
    <BKProvider>
      <AppContent />
    </BKProvider>
  );
}
