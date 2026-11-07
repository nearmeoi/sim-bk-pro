import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, Database } from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { TutWuriEmblem } from '../ui/KopSurat';

interface LoginViewProps {
  onSuccess: () => void;
  onToast: (msg: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onToast }) => {
  const { settings, login, isBackendConnected } = useBK();
  const [username, setUsername] = useState(settings.nipGuruBK || '19880512 201402 2 003');
  const [password, setPassword] = useState('guru123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      onToast('NIP atau nama pengguna wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(username, password);
      setLoading(false);

      if (res.success) {
        onToast(`Selamat datang, ${settings.guruBK ? settings.guruBK.split(',')[0] : 'Ibu Guru BK'}.`);
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Kata sandi atau NIP tidak sesuai.');
        onToast(res.error || 'Gagal masuk. Periksa kembali NIP dan kata sandi Anda.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleQuickLogin = async () => {
    setLoading(true);
    const nip = settings.nipGuruBK || '19880512 201402 2 003';
    setUsername(nip);
    setPassword('guru123');
    await login(nip, 'guru123');
    setLoading(false);
    onToast(`Selamat datang, ${settings.guruBK ? settings.guruBK.split(',')[0] : 'Ibu Guru BK'}.`);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-[400px] bg-surface rounded-rc border border-border shadow-card p-6 sm:p-8">
        {/* Header: identitas satuan pendidikan + Tut Wuri mark */}
        <div className="text-center space-y-2 mb-2">
          <span className="text-xs font-semibold text-muted tracking-tight">
            {settings.namaSekolah || 'SMP Negeri 1 Bintang'}
          </span>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-[22px] font-[750] text-text tracking-tight">
              Masuk
            </h1>
            <div className="w-6 h-6 flex shrink-0">
              <TutWuriEmblem />
            </div>
          </div>
          <p className="text-[12px] text-muted font-medium">
            Portal Bimbingan &amp; Konseling
          </p>
        </div>

        {/* Notifikasi Error jika ada */}
        {errorMessage && (
          <div className="p-3 rounded-rx bg-alert-tint text-alert text-sm font-medium border border-alert/20 leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Formulir Masuk */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text">
              NIP atau Nama Pengguna / Email
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                <User size={16} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan NIP atau email..."
                className="w-full min-h-tap pl-10 pr-4 rounded-rx border border-border text-sm font-medium text-text bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text">
              Kata Sandi Akun
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full min-h-tap pl-10 pr-11 rounded-rx border border-border text-sm font-medium text-text bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text cursor-pointer p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-muted font-medium hover:text-text">
              <input
                type="checkbox"
                className="rounded text-accent focus:ring-accent w-4 h-4 cursor-pointer"
              />
              <span>Ingat saya di perangkat ini</span>
            </label>
            <span className="text-accent hover:underline font-semibold cursor-pointer" onClick={() => onToast('Gunakan Akses Cepat di bawah jika lupa kata sandi.')}>
              Lupa sandi?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-tap rounded-rx bg-accent text-white text-sm font-bold active:scale-[0.98] transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Memverifikasi...' : 'Masuk'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Akses Cepat untuk Pengujian Guru BK */}
        <div className="pt-2 border-t border-border/60 text-center space-y-2">
          <p className="text-[11px] text-muted font-medium">Akses Cepat (1-Klik):</p>
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-rx bg-accent-tint hover:bg-accent-tint/80 text-accent text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-accent/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Masuk Langsung sebagai {settings.guruBK ? settings.guruBK.split(',')[0] : 'Ibu Guru BK'}</span>
          </button>
        </div>

        {/* Indikator Status Kesiapan Backend Supabase */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted">
          <div className="flex items-center gap-1.5">
            <Database size={13} className={isBackendConnected ? 'text-accent' : 'text-primary'} />
            <span className="font-semibold text-text">Status Backend:</span>
          </div>
          {isBackendConnected ? (
            <span className="px-2 py-0.5 rounded-full bg-accent-tint text-accent font-bold border border-accent/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Supabase Terhubung
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-primary-tint text-primary font-bold flex items-center gap-1" title="Siap dihubungkan ke Supabase kapan saja">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Siap Backend (Mode Lokal)
            </span>
          )}
        </div>
      </div>

      <p className="text-[11px] text-center text-muted mt-6">
        SIM-BK · Sistem Informasi Manajemen Bimbingan &amp; Konseling Sekolah
      </p>
    </div>
  );
};

export default LoginView;
