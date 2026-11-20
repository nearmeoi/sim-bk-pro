import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  DoorOpen,
  FileText,
  Folder,
  MessageSquare,
  Save,
  X,
} from 'lucide-react';
import { useBK } from '../context/BKContext';
import StudentPicker from '../components/ui/StudentPicker';
import DatePicker from '../components/ui/DatePicker';
import TimePicker from '../components/ui/TimePicker';
import { STATUS_STYLES } from '../lib/statusStyles';

export interface CatatPrefill {
  actionId?: string;
  nama?: string;
  kelas?: string;
}

interface MobileCatatSheetProps {
  prefill: CatatPrefill;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

const ACTIONS = [
  {
    id: 'konseling',
    label: 'Konseling Individual',
    desc: 'Wawancara tatap muka dengan siswa',
    icon: MessageSquare,
  },
  {
    id: 'kunjungan',
    label: 'Kunjungan Rumah',
    desc: 'Home visit & temu wali',
    icon: DoorOpen,
  },
  {
    id: 'kasus',
    label: 'Catat Kasus',
    desc: 'Kedisiplinan / masalah khusus',
    icon: Folder,
  },
  {
    id: 'jurnal',
    label: 'Jurnal Harian',
    desc: 'Kegiatan administrasi BK',
    icon: FileText,
  },
] as const;

const pad = (n: number) => String(n).padStart(2, '0');
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function MobileCatatSheet({ prefill, onClose, onSaved }: MobileCatatSheetProps) {
  const { students, addQuickCatat } = useBK();

  const [actionId, setActionId] = useState<string | null>(prefill.actionId ?? null);
  const [nama, setNama] = useState(prefill.nama ?? '');
  const [kelas, setKelas] = useState(prefill.kelas ?? '');
  const [tanggal, setTanggal] = useState(todayISO);
  const [waktu, setWaktu] = useState(nowTime);
  const [masalah, setMasalah] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');
  const [status, setStatus] = useState<'Proses' | 'Selesai' | 'Menunggu'>('Proses');

  const action = ACTIONS.find((a) => a.id === actionId) ?? null;

  const kelasOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.kelas).filter(Boolean));
    if (prefill.kelas) set.add(prefill.kelas);
    if (set.size === 0) {
      ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'].forEach((k) => set.add(k));
    }
    return [...Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true })), 'Umum'];
  }, [students, prefill.kelas]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const bisaSimpan = Boolean(action && nama.trim() && masalah.trim());

  const simpan = () => {
    if (!action || !bisaSimpan) return;
    addQuickCatat({
      actionId: action.id,
      actionLabel: action.label,
      namaSiswa: nama.trim(),
      kelas: kelas || 'Umum',
      tanggal,
      waktu,
      uraianMasalah: masalah.trim(),
      tindakLanjut: tindakLanjut.trim(),
      status,
    });
    onSaved(`Catatan ${action.label} untuk ${nama.trim()} berhasil disimpan.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Catat layanan baru"
        onClick={(e) => e.stopPropagation()}
        className="slide-up flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mt-3" />

        {/* Kepala — sama dengan CatatModal versi PC */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 pb-3 pt-3">
          {action ? (
            <button
              type="button"
              onClick={() => setActionId(null)}
              aria-label="Kembali ke pilihan layanan"
              className="p-1.5 -ml-1 text-muted active:text-text rounded-full active:bg-bg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="p-1.5 -ml-1 text-muted active:text-text rounded-full active:bg-bg transition-colors"
            >
              <X size={20} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-extrabold text-[18px] text-text leading-tight">
              {action ? action.label : 'Catat Layanan Baru'}
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              {action ? 'Lengkapi catatan konseling dan penanganan peserta didik' : 'Pilih kategori layanan bimbingan konseling'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!action ? (
            <div className="space-y-2.5">
              {ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setActionId(a.id)}
                    className="bk-row group !p-3.5"
                  >
                    <div className="bk-tile s flex-none">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="block font-bold text-[15px] text-text group-hover:text-primary transition-colors truncate">
                        {a.label}
                      </span>
                      <span className="block text-xs text-muted truncate mt-0.5">{a.desc}</span>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-muted/60 group-hover:text-primary transition-all flex-none"
                    />
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onClose}
                className="bk-btn ghost w-full min-h-[48px] text-text mt-2"
              >
                Batal
              </button>
            </div>
          ) : (
            <form
              className="fade-up space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                simpan();
              }}
            >
              <div>
                <label className="block text-xs font-bold text-text mb-1.5">
                  Nama Peserta Didik / Pihak Terlibat *
                </label>
                <StudentPicker
                  value={nama}
                  onChange={setNama}
                  onPick={(s) => setKelas(s.kelas)}
                  students={students}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1.5">Kelas / Rombel</label>
                <select
                  value={kelas || 'Umum'}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 rounded-[12px] border border-border text-sm text-text bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-sm"
                >
                  {kelasOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Tanggal</label>
                  <DatePicker value={tanggal} onChange={setTanggal} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Waktu</label>
                  <TimePicker value={waktu} onChange={setWaktu} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1.5">
                  Uraian Masalah / Catatan Konseling *
                </label>
                <textarea
                  rows={4}
                  value={masalah}
                  onChange={(e) => setMasalah(e.target.value)}
                  placeholder="Tuliskan kronologi masalah, keluhan siswa, atau hasil pengamatan..."
                  className="w-full min-h-[110px] p-3.5 rounded-[12px] border border-border text-sm leading-relaxed text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-sm resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1.5">
                  Rencana Tindak Lanjut
                </label>
                <textarea
                  rows={3}
                  value={tindakLanjut}
                  onChange={(e) => setTindakLanjut(e.target.value)}
                  placeholder="Contoh: Jadwal konseling lanjutan minggu depan, koordinasi dengan wali kelas..."
                  className="w-full min-h-[84px] p-3.5 rounded-[12px] border border-border text-sm leading-relaxed text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-sm resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-2">Status Penanganan</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['Proses', 'Selesai', 'Menunggu'] as const).map((st) => {
                    const meta = STATUS_STYLES[st];
                    const active = status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        aria-pressed={active}
                        className={`min-h-[46px] px-3 rounded-[12px] border text-xs font-bold inline-flex items-center justify-center gap-2 transition-all ${
                          active ? `${meta.solid} scale-[1.01]` : `${meta.soft} active:brightness-[0.98]`
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full flex-none ${
                            active ? 'bg-current opacity-90' : meta.dot
                          }`}
                        />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <button
                  type="submit"
                  disabled={!bisaSimpan}
                  className="min-h-[48px] w-full rounded-[14px] bg-accent text-white font-bold text-sm shadow-[0_6px_16px_rgb(var(--accent-rgb)/0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-black/20 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <Save size={17} />
                  Simpan Catatan Layanan
                </button>
                <button
                  type="button"
                  onClick={() => setActionId(null)}
                  className="bk-btn ghost w-full min-h-[48px]"
                >
                  Ganti Jenis Layanan
                </button>
                {!bisaSimpan && (
                  <p className="pt-1 text-center text-[11px] text-muted">
                    Isi nama siswa dan uraian masalah untuk menyimpan.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
