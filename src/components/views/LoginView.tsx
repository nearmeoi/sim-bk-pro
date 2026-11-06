import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, ShieldCheck, Database, Server } from 'lucide-react';
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
  const [rememberMe, setRememberMe] = useState(true);
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
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 py-8">
      <div className="w-full max-w-[440px] bg-surface rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-card border border-border space-y-6 fade-up">
        {/* Identitas Satuan Pendidikan & Dua Logo Resmi */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {/* Logo Kiri */}
            <div className="w-14 h-16 rounded-[14px] bg-white border border-border p-1 flex items-center justify-center shadow-xs">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo Daerah"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-center">
                  <div className="w-6 h-6 rounded-full border border-red-700 bg-red-100 flex items-center justify-center text-red-700 font-black text-[9px]">
                    MKS
                  </div>
                  <span className="text-[7.5px] font-black uppercase text-black mt-0.5 leading-none">PEMDA</span>
                </div>
              )}
            </div>

            {/* Logo Kanan (Tut Wuri) */}
            <div className="w-14 h-16 rounded-[14px] bg-white border border-border p-1 flex items-center justify-center shadow-xs">
              {settings.logoKananUrl ? (
                <img
                  src={settings.logoKananUrl}
                  alt="Logo Kanan"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center scale-90">
                  <TutWuriEmblem />
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="inline-block text-[10.5px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-tint text-primary mb-1">
              Portal Guru BK Resmi
            </span>
            <h1 className="text-[20px] sm:text-[22px] font-black text-text tracking-tight leading-tight">
              SIM-BK
            </h1>
            <p className="text-xs font-semibold text-muted mt-0.5">
              {settings.namaSekolah || 'SMP Negeri 1 Bintang'}
            </p>
          </div>
        </div>

        {/* Notifikasi Error jika ada */}
        {errorMessage && (
          <div className="p-3 rounded-[12px] bg-alert-tint text-alert text-xs font-semibold border border-alert/20 leading-relaxed fade-up">
            {errorMessage}
          </div>
        )}

        {/* Formulir Masuk */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text">
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
                className="w-full min-h-[46px] pl-10 pr-4 rounded-[12px] border border-border text-sm font-medium text-text bg-white focus:outline-none focus:border-primary shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text">
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
                className="w-full min-h-[46px] pl-10 pr-11 rounded-[12px] border border-border text-sm font-medium text-text bg-white focus:outline-none focus:border-primary shadow-xs"
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
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span>Ingat saya di perangkat ini</span>
            </label>
            <span className="text-primary hover:underline font-semibold cursor-pointer" onClick={() => onToast('Silakan gunakan Akses Cepat di bawah jika lupa kata sandi.')}>
              Lupa sandi?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-[14px] bg-primary text-white text-sm font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
          >
            <span>{loading ? 'Memverifikasi...' : 'Masuk ke Aplikasi BK'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Tombol Akses Cepat untuk Pengujian Guru BK */}
        <div className="pt-2 border-t border-border/80 text-center space-y-2">
          <p className="text-[11px] text-muted font-medium">Akses Cepat Pengujian (1-Klik):</p>
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-[12px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-emerald-200 cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>Masuk Langsung sebagai {settings.guruBK ? settings.guruBK.split(',')[0] : 'Ibu Guru BK'}</span>
          </button>
        </div>

        {/* Indikator Status Kesiapan Backend Supabase */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted">
          <div className="flex items-center gap-1.5">
            <Database size={13} className={isBackendConnected ? 'text-emerald-600' : 'text-primary'} />
            <span className="font-semibold text-text">Status Backend:</span>
          </div>
          {isBackendConnected ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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

      <p className="text-[11px] text-center text-muted mt-4">
        SIM-BK · Sistem Informasi Manajemen Bimbingan & Konseling Sekolah
      </p>
    </div>
  );
};

export default LoginView;
