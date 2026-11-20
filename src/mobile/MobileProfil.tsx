import { useState } from 'react';
import {
  Building2,
  LogOut,
  Monitor,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useBK } from '../context/BKContext';

interface MobileProfilProps {
  onToast: (msg: string) => void;
  onOpenPengaturan: () => void;
}

export default function MobileProfil({ onToast, onOpenPengaturan }: MobileProfilProps) {
  const {
    settings,
    students,
    records,
    cases,
    logout,
    isSyncing,
    lastSynced,
    syncAllFromCloud,
  } = useBK();
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false);

  const siswaAktif = students.filter((s) => s.status === 'Aktif').length;
  const kasusSelesai = cases.filter((c) => c.status === 'Selesai').length;

  const sinkron = async () => {
    const ok = await syncAllFromCloud();
    onToast(ok ? 'Data berhasil disinkronkan.' : 'Sinkronisasi gagal. Periksa koneksi.');
  };

  return (
    <div className="fade-up space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-[750] text-text tracking-tight">Profil</h1>
        <span className="bk-me">{settings.guruBK.trim().charAt(0) || 'G'}</span>
      </div>

      {/* Identitas sekolah */}
      <section className="space-y-2.5">
        <h2 className="text-[17px] font-[750] text-text">Identitas Sekolah</h2>
        <div className="bk-card">
          <div className="flex items-start gap-3">
            <div className="bk-tile s flex-none">
              <Building2 size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-text leading-tight">
                {settings.namaSekolah || 'Nama sekolah belum diisi'}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-muted">
                NPSN {settings.npsn || '-'} · TA {settings.tahunAjaran || '-'}
              </p>
            </div>
          </div>

          <dl className="mt-3.5 space-y-2 border-t border-border pt-3.5 text-xs">
            {[
              ['Kepala Sekolah', settings.kepalaSekolah],
              ['Guru BK', settings.guruBK],
              ['Alamat', settings.alamat],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="font-bold text-muted">{label}</dt>
                <dd className="max-w-[60%] text-right font-semibold text-text leading-snug">
                  {value || '-'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <button type="button" onClick={onOpenPengaturan} className="bk-row !p-3.5">
        <div className="bk-tile s flex-none">
          <Settings size={18} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <span className="block text-[14px] font-bold text-text">Edit Data Sekolah</span>
          <span className="mt-0.5 block text-[11px] font-semibold text-muted">
            Kop surat, logo, dan pejabat penandatangan
          </span>
        </div>
        <span className="flex-none text-muted/60">→</span>
      </button>

      {/* Ringkasan */}
      <section className="space-y-2.5">
        <h2 className="text-[17px] font-[750] text-text">Ringkasan Data</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Siswa Aktif', value: siswaAktif, tone: 'text-black' },
            { label: 'Catatan', value: records.length, tone: 'text-gray-700' },
            { label: 'Kasus Selesai', value: kasusSelesai, tone: 'text-accent' },
          ].map((s) => (
            <div key={s.label} className="bk-card p-3.5 text-center">
              <span className={`block text-[26px] font-black leading-none ${s.tone}`}>
                {s.value}
              </span>
              <span className="mt-1 block text-[11px] font-semibold text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sinkronisasi */}
      <section className="space-y-2.5">
        <h2 className="text-[17px] font-[750] text-text">Sinkronisasi</h2>

        <button
          type="button"
          onClick={sinkron}
          disabled={isSyncing}
          className="bk-row !p-3.5 disabled:opacity-60"
        >
          <div className="bk-tile s flex-none">
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="block text-[14px] font-bold text-text">Sinkronkan Ulang</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-muted">
              {lastSynced
                ? `Terakhir: ${lastSynced.toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Belum pernah disinkronkan'}
            </span>
          </div>
          {isSyncing && <span className="flex-none text-[11px] font-bold text-accent">Proses…</span>}
        </button>

        <div className="bk-card flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 flex-none text-[#047857]" />
          <p className="text-[11px] font-semibold leading-relaxed text-muted">
            Data ponsel dan PC memakai akun yang sama. Perubahan dari perangkat ini langsung
            tersimpan ke penyimpanan lokal dan disinkronkan ke cloud.
          </p>
        </div>
      </section>

      {/* Versi aplikasi & keluar */}
      <section className="space-y-2.5">
        <h2 className="text-[17px] font-[750] text-text">Versi Aplikasi</h2>

        <a href="/?desktop=1" className="bk-row !p-3.5">
          <div className="bk-tile s flex-none">
            <Monitor size={18} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="block text-[14px] font-bold text-text">Buka Versi PC</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-muted">
              Tabel lengkap, cetak surat, dan dokumen
            </span>
          </div>
        </a>

        <div className="bk-row !p-3.5">
          <div className="bk-tile s flex-none">
            <Smartphone size={18} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="block text-[14px] font-bold text-text">Versi Ponsel</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-muted">
              /m/ · tampilan khusus layar kecil
            </span>
          </div>
        </div>

        {konfirmasiKeluar ? (
          <div className="bk-card border-[#FCA5A5] bg-[#FEE2E2]">
            <p className="text-xs font-bold text-[#991B1B]">Keluar dari akun di perangkat ini?</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setKonfirmasiKeluar(false);
                  logout();
                }}
                className="bk-btn danger flex-1 min-h-[46px]"
              >
                Ya, keluar
              </button>
              <button
                type="button"
                onClick={() => setKonfirmasiKeluar(false)}
                className="bk-btn ghost flex-1 min-h-[46px]"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setKonfirmasiKeluar(true)}
            className="bk-btn ghost w-full min-h-[48px] !text-alert"
          >
            <LogOut size={16} /> Keluar Akun
          </button>
        )}
      </section>

      <p className="pb-2 pt-1 text-center text-[11px] font-semibold text-muted">
        SIM BK PRO · versi ponsel
      </p>
    </div>
  );
}
