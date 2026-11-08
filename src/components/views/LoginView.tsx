import React, { useState } from 'react';
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useBK } from '../../context/BKContext';

interface LoginViewProps {
  onSuccess: () => void;
  onToast: (msg: string) => void;
}

/** Logo Google resmi (simplified) */
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2.05 3.5-5.05 3.5-8.55" />
    <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.14.01-3.6 2.8-.05.12C3.4 21.3 7.4 24 12 24" />
    <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4V9.4L1.4 6.6l-.12.06C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3" />
    <path fill="#EA4335" d="M12 4.8c2.2 0 3.7.9 4.5 1.7l3.3-3.2C17.9 1.3 15.2 0 12 0 7.4 0 3.4 2.7 1.3 6.6l3.9 3c1-2.9 3.7-4.8 6.8-4.8" />
  </svg>
);

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onToast }) => {
  const { login, loginWithGoogle, resetPasswordEmail } = useBK();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<'form' | 'google' | 'reset' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Isi email di kolom atas dulu, lalu tekan kirim ulang sandi.');
      return;
    }
    setErrorMessage(null);
    setLoading('reset');
    const res = await resetPasswordEmail(email);
    setLoading(null);
    if (res.success) {
      setResetSent(true);
      onToast('Email pengaturan ulang sandi terkirim. Periksa kotak masuk Anda.');
    } else {
      setErrorMessage(res.error || 'Gagal mengirim email reset sandi.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage('Email dan kata sandi wajib diisi.');
      return;
    }
    setLoading('form');
    const res = await login(email.trim(), password);
    setLoading(null);
    if (res.success) {
      onToast('Selamat datang kembali.');
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Email atau kata sandi tidak sesuai.');
    }
  };

  const handleGoogle = async () => {
    setErrorMessage(null);
    setLoading('google');
    const res = await loginWithGoogle();
    setLoading(null);
    // Bila redirect OAuth gagal diproses (bukan pindah halaman), tampilkan sebabnya.
    if (!res.success) setErrorMessage(res.error || 'Login Google gagal. Coba lagi.');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[400px] bg-surface rounded-[28px] p-7 sm:p-9 shadow-card border border-border space-y-7 fade-up">
        {/* Brand */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-[14px] bg-primary flex items-center justify-center text-white font-black text-lg shadow-hero">
            BK
          </div>
          <h1 className="text-[22px] font-black text-text tracking-tight pt-2">SIM BK PRO</h1>
          <p className="text-[13px] text-muted leading-relaxed">
            Masuk untuk melanjutkan pengelolaan
            <br />
            bimbingan &amp; konseling Anda.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-rx bg-alert-tint text-alert text-sm font-medium border border-alert/20 leading-relaxed">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-bold text-text">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sekolah.sch.id"
              className="w-full min-h-[46px] px-4 rounded-[12px] border border-border text-sm font-medium text-text bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 shadow-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-bold text-text">
              Kata sandi
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                <Lock size={16} />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi Anda"
                className="w-full min-h-[46px] pl-10 pr-11 rounded-[12px] border border-border text-sm font-medium text-text bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text cursor-pointer p-1"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-muted font-medium">Sandi pribadi Anda, jangan dibagikan.</span>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading !== null}
              className="text-primary hover:underline font-bold cursor-pointer disabled:opacity-50"
            >
              {loading === 'reset' ? 'Mengirim...' : 'Lupa sandi?'}
            </button>
          </div>

          {resetSent && (
            <div className="p-3 rounded-[12px] bg-accent-tint text-accent text-xs font-semibold border border-accent/20 leading-relaxed fade-up">
              Email pengaturan ulang sandi telah dikirim ke <b>{email}</b>. Buka tautan di dalamnya untuk membuat sandi baru.
            </div>
          )}

          <button
            type="submit"
            disabled={loading !== null}
            className="w-full min-h-[48px] rounded-[14px] bg-primary text-white text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
          >
            <span>{loading === 'form' ? 'Memverifikasi...' : 'Masuk'}</span>
            {loading !== 'form' && <ArrowRight size={20} />}
          </button>
        </form>

        {/* Login Google */}
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted font-semibold">atau</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading !== null}
          className="w-full min-h-[48px] rounded-[14px] bg-white border border-border text-sm font-bold text-text hover:bg-[#F7F8FC] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
        >
          <GoogleIcon />
          <span>{loading === 'google' ? 'Mengalihkan ke Google...' : 'Masuk dengan Google'}</span>
        </button>
      </div>

      <p className="text-[11px] text-center text-muted mt-5">
        SIM BK PRO · Sistem Informasi Manajemen Bimbingan &amp; Konseling
      </p>
    </div>
  );
};

export default LoginView;
