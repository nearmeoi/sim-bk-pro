import { ChevronRight, AlertCircle, NotebookPen, Plus } from 'lucide-react';
import { useBK } from '../context/BKContext';
import { greeting } from '../data/dummy';
import { statusStyle } from '../lib/statusStyles';
import type { CatatPrefill } from './MobileCatatSheet';

interface MobileBerandaProps {
  onCatat: (prefill?: CatatPrefill) => void;
  onOpenStudent: (studentId: string) => void;
  onOpenSiswa: () => void;
  onOpenProfil: () => void;
}

const tanggalPendek = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

export default function MobileBeranda({
  onCatat,
  onOpenStudent,
  onOpenSiswa,
  onOpenProfil,
}: MobileBerandaProps) {
  const { cases, records, settings } = useBK();

  const kasusProses = cases.filter((c) => c.status === 'Proses');
  const catatanTerbaru = [...records]
    .sort((a, b) => `${b.tanggal}${b.waktu}`.localeCompare(`${a.tanggal}${a.waktu}`))
    .slice(0, 4);

  return (
    <div className="fade-up space-y-6">
      {/* 1. Sapaan & Profil — sama dengan BerandaView versi PC */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-[750] text-text tracking-tight">
          {greeting()}, Ibu Guru
        </h1>
        <button
          type="button"
          onClick={onOpenProfil}
          className="bk-me active:scale-95 transition-all"
          title="Buka Profil Pengguna"
          aria-label="Profil"
        >
          G
        </button>
      </div>

      {/* 2. Hero Banner */}
      <div className="bk-hero">
        <div className="relative z-10 space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-black bg-white px-2.5 py-0.5 rounded-full">
            Bimbingan & Konseling
          </span>
          <h2 className="text-[22px] font-bold text-white tracking-tight leading-snug">
            {settings.namaSekolah || 'SIM BK PRO'}
          </h2>
          <p className="text-xs text-white/90 leading-relaxed">
            Catatan konseling tersimpan ke buku siswa dan jurnal harian.
          </p>

          <button
            type="button"
            onClick={() => onCatat()}
            className="mt-3 w-full min-h-[48px] px-6 rounded-[14px] bg-white text-black font-black text-sm shadow-md hover:bg-white/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} strokeWidth={2.5} className="text-accent" />
            <span>Catat Layanan</span>
          </button>
        </div>
      </div>

      {/* 3. Perlu Tindak Lanjut */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-[750] text-text">Perlu Tindak Lanjut</h2>
          <span className="bk-pill whitespace-nowrap">{kasusProses.length} Kasus</span>
        </div>

        {kasusProses.length === 0 ? (
          <div className="bk-card text-center">
            <p className="text-xs text-gray-500 italic">
              Tidak ada kasus mendesak yang sedang berjalan saat ini. Semua tertangani dengan baik.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {kasusProses.slice(0, 5).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onOpenStudent(c.studentId)}
                className="bk-row !p-3.5"
              >
                <span className="bk-ini r">
                  <AlertCircle size={18} />
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <span className="block font-bold text-[14px] text-text truncate">
                    {c.namaSiswa}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-muted">
                    Kelas {c.kelas} · {c.masalah}
                  </span>
                </div>
                <div className="flex-none text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${statusStyle(c.status).soft}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-none ${statusStyle(c.status).dot}`} />
                    {c.status}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold text-muted">
                    {tanggalPendek(c.tanggal)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 4. Catatan Terbaru */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-[750] text-text">Catatan Terbaru</h2>
          <button
            type="button"
            onClick={onOpenSiswa}
            className="text-xs font-bold text-muted active:text-text flex items-center gap-0.5"
          >
            Lihat Semua <ChevronRight size={14} />
          </button>
        </div>

        {catatanTerbaru.length === 0 ? (
          <div className="bk-card text-center">
            <NotebookPen size={20} className="mx-auto mb-1.5 text-muted/50" />
            <p className="text-xs text-gray-500 italic">
              Belum ada catatan. Mulai dengan tombol Catat di bawah.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {catatanTerbaru.map((r) => (
              <div key={r.id} className="bk-row !p-3.5 items-start">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-text">{r.namaSiswa}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-muted">
                    Kelas {r.kelas} · {r.jenis}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-text/80">
                    {r.masalah}
                  </p>
                </div>
                <div className="flex-none text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${statusStyle(r.status).soft}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-none ${statusStyle(r.status).dot}`} />
                    {r.status}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold text-muted">
                    {tanggalPendek(r.tanggal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
