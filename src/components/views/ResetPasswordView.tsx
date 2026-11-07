import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

/** Halaman tujuan tautan email "lupa sandi" (/reset untuk Vercel rewrite ke index.html). */
const ResetPasswordView: React.FC = () => {
  // supabase-js otomatis menukar kode recovery di URL menjadi sesi saat halaman dibuka
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) {
      setErr('Sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirm) {
      setErr('Konfirmasi sandi tidak sama.');
      return;
    }
    setLoading(true);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        setErr('Server belum terhubung. Buka tautan ini melalui aplikasi web SIM BK PRO.');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) {
        setErr(error.message);
        return;
      }
      setMsg('Sandi berhasil diubah. Silakan masuk dengan sandi baru Anda.');
    } catch (ex) {
      setLoading(false);
      setErr(ex instanceof Error ? ex.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[400px] bg-surface rounded-[28px] p-7 sm:p-9 shadow-card border border-border space-y-5 fade-up">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-[14px] bg-primary flex items-center justify-center text-white font-black text-lg shadow-hero">
            BK
          </div>
          <h1 className="text-[20px] font-black text-text tracking-tight pt-2">Buat Sandi Baru</h1>
          <p className="text-[13px] text-muted">Atur ulang sandi untuk akun SIM BK PRO Anda.</p>
        </div>

        {err && (
          <div className="p-3 rounded-[12px] bg-alert-tint text-alert text-xs font-semibold border border-alert/20 leading-relaxed fade-up">
            {err}
          </div>
        )}
        {msg && (
          <div className="p-3 rounded-[12px] bg-accent-tint text-accent text-xs font-semibold border border-accent/20 leading-relaxed fade-up">
            {msg}
          </div>
        )}

        {!msg ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="rp-pass" className="block text-xs font-bold text-text">
                Sandi baru
              </label>
              <input
                id="rp-pass"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full min-h-[46px] px-4 rounded-[12px] border border-border text-sm font-medium text-text bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 shadow-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rp-confirm" className="block text-xs font-bold text-text">
                Ulangi sandi baru
              </label>
              <input
                id="rp-confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Samakan dengan sandi di atas"
                className="w-full min-h-[46px] px-4 rounded-[12px] border border-border text-sm font-medium text-text bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bk-btn primary w-full min-h-[48px] disabled:opacity-60"
            >
              <span>{loading ? 'Menyimpan...' : 'Simpan Sandi Baru'}</span>
            </button>
          </form>
        ) : (
          <a
            href="/"
            className="bk-btn primary w-full min-h-[48px] no-underline"
          >
            Kembali ke Halaman Masuk
          </a>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordView;
