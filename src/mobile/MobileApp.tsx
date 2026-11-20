import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Home, Users, FileText, Menu as MenuIcon, Plus, Loader2 } from 'lucide-react';
import { useBK } from '../context/BKContext';
import LoginView from '../components/views/LoginView';
import Toast from '../components/ui/Toast';
import MobileBeranda from './MobileBeranda';
import MobileSiswa from './MobileSiswa';
import MobileGuru from './MobileGuru';
import MobileProfil from './MobileProfil';
import MobileMenu from './MobileMenu';
import MobileDokumen from './MobileDokumen';
import MobileAKPD from './MobileAKPD';
import MobileKarir from './MobileKarir';
import MobilePengaturan from './MobilePengaturan';
import MobileTataTertib from './MobileTataTertib';
import StudentPortal from './portal/StudentPortal';
import MobileProta from './docs/MobileProta';
import MobileJurnal from './docs/MobileJurnal';
import MobileRpl from './docs/MobileRpl';
import MobileProsem from './docs/MobileProsem';
import MobileLapbul from './docs/MobileLapbul';
import MobileLapsem from './docs/MobileLapsem';
import MobileStudentSheet from './MobileStudentSheet';
import MobileCatatSheet, { type CatatPrefill } from './MobileCatatSheet';
import type { Student } from '../types';

export type MobileRoute =
  | 'beranda'
  | 'siswa'
  | 'guru'
  | 'tata-tertib'
  | 'dokumen'
  | 'akpd'
  | 'karir'
  | 'pengaturan'
  | 'profil'
  | 'prota'
  | 'jurnal'
  | 'rpl'
  | 'prosem'
  | 'lapbul'
  | 'lapsem';

const DOC_ROUTES: MobileRoute[] = ['prota', 'jurnal', 'rpl', 'prosem', 'lapbul', 'lapsem'];

type Tab = 'beranda' | 'siswa' | 'dokumen' | 'menu';

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'beranda', label: 'Beranda', icon: Home },
  { id: 'siswa', label: 'Siswa', icon: Users },
  { id: 'dokumen', label: 'Dokumen', icon: FileText },
  { id: 'menu', label: 'Menu', icon: MenuIcon },
];

/**
 * Filter SVG untuk distorsi kaca cair. Dipakai oleh backdrop-filter di
 * `.m-bottom-nav::after` dan `.m-nav-pill::before`. Filter ini bekerja
 * langsung pada backdrop (bukan snapshot), jadi ikut live setiap frame.
 */
function LiquidGlassFilters() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter
          id="lg-liquid-nav"
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.014"
            numOctaves="2"
            seed="5"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1.2" result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale="22"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter
          id="lg-liquid-pill"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.028"
            numOctaves="2"
            seed="9"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1" result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale="26"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

export default function MobileApp() {
  const { isAuthenticated, isBooting, students } = useBK();
  const [route, setRoute] = useState<MobileRoute>('beranda');
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [catat, setCatat] = useState<CatatPrefill | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [portalCard] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('card') ?? '';
  });

  // Navigasi memakai backdrop-filter native (live, tanpa snapshot).
  const navRef = useRef<HTMLElement | null>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(null);
    requestAnimationFrame(() => setToast(msg));
  }, []);

  const navigate = useCallback((next: MobileRoute) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (route !== 'beranda') window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route]);

  const openStudent = useCallback(
    (studentId: string) => {
      const found = students.find((s) => s.id === studentId);
      if (found) setSelected(found);
    },
    [students],
  );

  const activeTab: Tab =
    route === 'beranda'
      ? 'beranda'
      : route === 'siswa'
        ? 'siswa'
        : route === 'dokumen' || DOC_ROUTES.includes(route)
          ? 'dokumen'
          : 'menu';

  // Ukur posisi tab aktif → lensa kaca meluncur ke sana.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const btn = nav.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
      if (!btn) return;
      const navRect = nav.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setPill({ x: btnRect.left - (navRect.left + nav.clientLeft), w: btnRect.width });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeTab, isAuthenticated, isBooting]);

  // Tab bawah — pil mengambang (floating pill) khas aplikasi ponsel
  const tabButton = (t: (typeof TABS)[number]) => {
    const Icon = t.icon;
    const active = activeTab === t.id;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => {
          if (t.id === 'menu') {
            setMenuOpen(true);
            return;
          }
          navigate(t.id);
        }}
        aria-current={active ? 'page' : undefined}
        data-tab={t.id}
        className={`relative z-[1] flex min-h-[54px] flex-1 select-none flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] leading-none transition-[color,transform] duration-200 ${
          active
            ? 'font-bold text-accent'
            : 'font-medium text-muted active:scale-95'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
        <span className="mt-0.5 leading-none">{t.label}</span>
      </button>
    );
  };

  // Kartu QR membuka portal siswa, tanpa melewati login staf.
  if (portalCard) {
    return <StudentPortal initialToken={portalCard} />;
  }

  if (isBooting) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-8">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Loader2 size={26} className="animate-spin" />
          <p className="text-[12px] font-bold uppercase tracking-wider">Memuat data…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="m-app min-h-screen bg-bg">
        <LoginView onSuccess={() => setRoute('beranda')} onToast={showToast} />
        <Toast message={toast} />
      </div>
    );
  }

  const page = (() => {
    switch (route) {
      case 'beranda':
        return (
          <MobileBeranda
            onCatat={(p) => setCatat(p ?? {})}
            onOpenStudent={openStudent}
            onOpenSiswa={() => navigate('siswa')}
            onOpenProfil={() => navigate('profil')}
          />
        );
      case 'siswa':
        return <MobileSiswa onOpenStudent={setSelected} onCatat={(p) => setCatat(p ?? {})} />;
      case 'guru':
        return <MobileGuru onBack={() => navigate('beranda')} onToast={showToast} />;
      case 'tata-tertib':
        return <MobileTataTertib onBack={() => navigate('beranda')} onToast={showToast} />;
      case 'dokumen':
        return <MobileDokumen onOpen={navigate} />;
      case 'akpd':
        return <MobileAKPD onBack={() => navigate('dokumen')} onToast={showToast} />;
      case 'karir':
        return <MobileKarir onBack={() => navigate('dokumen')} onToast={showToast} />;
      case 'pengaturan':
        return <MobilePengaturan onBack={() => navigate('beranda')} onToast={showToast} />;
      case 'profil':
        return (
          <MobileProfil
            onToast={showToast}
            onOpenPengaturan={() => navigate('pengaturan')}
          />
        );
      case 'prota':
        return <MobileProta onBack={() => navigate('dokumen')} onToast={showToast} />;
      case 'jurnal':
        return <MobileJurnal onBack={() => navigate('dokumen')} onToast={showToast} />;
      case 'rpl':
        return <MobileRpl onBack={() => navigate('dokumen')} onToast={showToast} />;
      case 'prosem':
        return <MobileProsem onBack={() => navigate('dokumen')} onToast={showToast} />;
      case 'lapbul':
        return <MobileLapbul onBack={() => navigate('dokumen')} onToast={showToast} />;
      case 'lapsem':
        return <MobileLapsem onBack={() => navigate('dokumen')} onToast={showToast} />;
      default:
        return null;
    }
  })();

  return (
    <div className="m-app min-h-screen bg-bg text-text">
      <LiquidGlassFilters />
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col">
        <main className="flex-1 px-4 py-5 pb-32">{page}</main>

        {/* Navigasi bawah sengaja di luar <main>/outlet halaman agar tidak
            pernah unmount saat rute berganti. Layer & stacking context-nya
            diatur oleh .m-bottom-nav (fixed, isolation, translate3d). */}
        <nav
          ref={navRef}
          aria-label="Navigasi utama"
          className="m-bottom-nav flex w-[calc(100%-1.5rem)] max-w-[430px] items-center gap-0.5 rounded-full border p-1.5"
          style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Lensa kaca tab aktif — meluncur dengan sedikit ayunan */}
          {pill && (
            <div
              aria-hidden="true"
              className="m-nav-pill"
              style={{ width: pill.w, transform: `translate3d(${pill.x}px, 0, 0)` }}
            />
          )}

          {tabButton(TABS[0])}
          {tabButton(TABS[1])}

          <button
            type="button"
            onClick={() => setCatat({})}
            aria-label="Catat Layanan"
            className="relative z-[1] flex min-h-[54px] flex-1 select-none items-center justify-center"
          >
            <span className="m-fab grid h-[52px] w-[52px] place-items-center rounded-full transition-transform active:scale-90">
              <Plus size={24} strokeWidth={2.6} />
            </span>
          </button>

          {tabButton(TABS[2])}
          {tabButton(TABS[3])}
        </nav>

        <MobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={navigate}
          onToast={showToast}
        />

        <MobileStudentSheet
          student={selected}
          onClose={() => setSelected(null)}
          onToast={showToast}
          onCatat={(s) => {
            setSelected(null);
            setCatat({ nama: s.nama, kelas: s.kelas });
          }}
        />

        {catat && (
          <MobileCatatSheet
            prefill={catat}
            onClose={() => setCatat(null)}
            onSaved={(msg) => {
              setCatat(null);
              showToast(msg);
            }}
          />
        )}

        <Toast message={toast} />
      </div>
    </div>
  );
}
