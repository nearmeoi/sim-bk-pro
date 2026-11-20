import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeColor = 'oranye' | 'biru' | 'hijau' | 'ungu' | 'mawar' | 'toska';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemePrefs {
  color: ThemeColor;
  mode: ThemeMode;
}

export const THEME_COLORS: {
  id: ThemeColor;
  label: string;
  swatch: string;
  swatch2: string;
}[] = [
  { id: 'oranye', label: 'Oranye', swatch: '#FFA36C', swatch2: '#FF8A3D' },
  { id: 'biru', label: 'Biru', swatch: '#60A5FA', swatch2: '#3B82F6' },
  { id: 'hijau', label: 'Hijau', swatch: '#4ADE80', swatch2: '#22C55E' },
  { id: 'ungu', label: 'Ungu', swatch: '#A78BFA', swatch2: '#8B5CF6' },
  { id: 'mawar', label: 'Mawar', swatch: '#FB7185', swatch2: '#F43F5E' },
  { id: 'toska', label: 'Toska', swatch: '#2DD4BF', swatch2: '#14B8A6' },
];

export const THEME_MODES: { id: ThemeMode; label: string }[] = [
  { id: 'light', label: 'Terang' },
  { id: 'dark', label: 'Gelap' },
  { id: 'system', label: 'Sistem' },
];

const STORAGE_KEY = 'sim_bk_theme';
const DEFAULT_PREFS: ThemePrefs = { color: 'oranye', mode: 'light' };

export function loadThemePrefs(): ThemePrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as Partial<ThemePrefs>;
    const color = THEME_COLORS.some((c) => c.id === raw.color)
      ? (raw.color as ThemeColor)
      : DEFAULT_PREFS.color;
    const mode = THEME_MODES.some((m) => m.id === raw.mode)
      ? (raw.mode as ThemeMode)
      : DEFAULT_PREFS.mode;
    return { color, mode };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function prefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return prefersDark();
}

/** Pasang atribut tema di <html>; hanya dipakai aplikasi ponsel. */
export function applyTheme(prefs: ThemePrefs): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-m-app', '1');
  root.setAttribute('data-theme', prefs.color);
  root.setAttribute('data-mode', resolveDark(prefs.mode) ? 'dark' : 'light');

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const swatch = THEME_COLORS.find((c) => c.id === prefs.color)?.swatch2 ?? '#FF8A3D';
    meta.setAttribute('content', resolveDark(prefs.mode) ? '#0E1116' : swatch);
  }
}

interface ThemeContextValue {
  color: ThemeColor;
  mode: ThemeMode;
  isDark: boolean;
  setColor: (color: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ThemePrefs>(() => loadThemePrefs());
  const [isDark, setIsDark] = useState(() => resolveDark(loadThemePrefs().mode));

  // Terapkan setiap kali preferensi berubah + simpan.
  useEffect(() => {
    applyTheme(prefs);
    setIsDark(resolveDark(prefs.mode));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* penyimpanan penuh / diblokir — abaikan */
    }
  }, [prefs]);

  // Ikuti perubahan tema sistem saat mode = "system".
  useEffect(() => {
    if (prefs.mode !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyTheme(prefs);
      setIsDark(mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [prefs]);

  const setColor = useCallback(
    (color: ThemeColor) => setPrefs((p) => (p.color === color ? p : { ...p, color })),
    [],
  );
  const setMode = useCallback(
    (mode: ThemeMode) => setPrefs((p) => (p.mode === mode ? p : { ...p, mode })),
    [],
  );
  const reset = useCallback(() => setPrefs(DEFAULT_PREFS), []);

  const value = useMemo<ThemeContextValue>(
    () => ({ color: prefs.color, mode: prefs.mode, isDark, setColor, setMode, reset }),
    [prefs.color, prefs.mode, isDark, setColor, setMode, reset],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme harus dipakai di dalam ThemeProvider');
  return ctx;
}
