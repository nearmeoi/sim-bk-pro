import { useState, useEffect } from 'react';
import { DoorOpen, MessageSquare, Folder, FileText, ChevronRight, ArrowLeft, Check, Save } from 'lucide-react';
import { useBK } from '../../context/BKContext';
import type { QuickCatatPayload } from '../../types';
interface CatatModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (jenis: string) => void;
}

const ACTIONS = [
  {
    id: 'konseling',
    label: 'Konseling Individual',
    desc: 'Wawancara tatap muka mendalam dengan peserta didik',
    icon: MessageSquare,
  },
  {
    id: 'kunjungan',
    label: 'Kunjungan Rumah (Home Visit)',
    desc: 'Kunjungan langsung ke kediaman siswa dan temu wali',
    icon: DoorOpen,
  },
  {
    id: 'kasus',
    label: 'Catat Kasus / Masalah Khusus',
    desc: 'Pencatatan masalah kedisiplinan atau ketertiban siswa',
    icon: Folder,
  },
  {
    id: 'jurnal',
    label: 'Entri Jurnal Harian BK',
    desc: 'Pencatatan cepat kegiatan administrasi dan bimbingan harian',
    icon: FileText,
  },
];

export default function CatatModal({ open, onClose, onSelect }: CatatModalProps) {
  const { addQuickCatat, students } = useBK();
  const [selectedAction, setSelectedAction] = useState<typeof ACTIONS[0] | null>(null);

  // Form state
  const [namaSiswa, setNamaSiswa] = useState('');
  const [kelas, setKelas] = useState('8A');
  const [tanggal, setTanggal] = useState('2026-11-05');
  const [waktu, setWaktu] = useState('09:00');
  const [uraianMasalah, setUraianMasalah] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');
  const [status, setStatus] = useState<'Proses' | 'Selesai' | 'Menunggu'>('Proses');
  useEffect(() => {
    if (!open) {
      setSelectedAction(null);
      return;
    }
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', fn);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSiswa.trim()) {
      return;
    }

    const payload: QuickCatatPayload = {
      actionId: selectedAction?.id || 'konseling',
      actionLabel: selectedAction?.label || 'Konseling Individual',
      namaSiswa: namaSiswa.trim(),
      kelas,
      tanggal,
      waktu,
      uraianMasalah: uraianMasalah.trim() || `Pencatatan layanan ${selectedAction?.label || 'Bimbingan Konseling'}.`,
      tindakLanjut: tindakLanjut.trim(),
      status,
    };

    addQuickCatat(payload);
    onSelect(`Catatan ${payload.actionLabel} untuk ${payload.namaSiswa} berhasil disimpan.`);

    // Reset form
    setNamaSiswa('');
    setUraianMasalah('');
    setTindakLanjut('');
    setSelectedAction(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[3px] p-0 sm:p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className={`w-full ${
          selectedAction ? 'max-w-2xl' : 'max-w-[480px]'
        } bg-surface rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-7 shadow-2xl slide-up max-h-[92vh] overflow-y-auto`}
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar on mobile */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4 sm:hidden" />

        {!selectedAction ? (
          /* Step 1: Menu Pilihan Layanan */
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="font-extrabold text-[20px] text-text">Catat Layanan Baru</h3>
              <p className="text-xs text-muted mt-1">Pilih kategori layanan bimbingan konseling yang akan dicatat</p>
            </div>

            <div className="space-y-2.5">
              {ACTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedAction(item)}
                    className="bk-row group !p-3.5"
                  >
                    <div className="bk-tile s flex-none">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="block font-bold text-[15px] text-text group-hover:text-primary transition-colors truncate">
                        {item.label}
                      </span>
                      <span className="block text-xs text-muted truncate mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-muted/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-none"
                    />
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="w-full min-h-[48px] rounded-[14px] bg-bg hover:bg-gray-200 text-text font-bold text-[14px] transition-colors mt-2 active:scale-[0.99]"
            >
              Batal
            </button>
          </div>
        ) : (
          /* Step 2: Form Pencatatan Luas & Nyaman */
          <form onSubmit={handleSubmit} className="space-y-5 fade-up">
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="p-1.5 -ml-1 text-muted hover:text-text rounded-full hover:bg-bg transition-colors"
                  title="Kembali ke pilihan layanan"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="font-extrabold text-[18px] text-text">
                    {selectedAction.label}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">Lengkapi catatan konseling dan penanganan peserta didik</p>
                </div>
              </div>
            </div>

            {/* Identitas Siswa & Waktu */}
            <div className="grid sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-text mb-1.5">
                  Nama Peserta Didik / Pihak Terlibat *
                </label>
                <input
                  type="text"
                  required
                  list="registered-students"
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  placeholder="Pilih atau ketik nama siswa..."
                  className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-sm"
                />
                <datalist id="registered-students">
                  {students.map((s) => (
                    <option key={s.id} value={s.nama}>
                      {s.nama} ({s.kelas}) - NIS {s.nis}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1.5">
                  Kelas / Rombel
                </label>
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 rounded-[12px] border border-border text-sm text-text bg-surface focus:outline-none focus:border-primary"
                >
                  {['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C', 'Umum'].map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-text mb-1.5">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 rounded-[12px] border border-border text-sm text-text bg-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text mb-1.5">Waktu / Pukul</label>
                <input
                  type="time"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 rounded-[12px] border border-border text-sm text-text bg-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Uraian Masalah: Lapang, Multiline, Nyaman */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-text">
                  Uraian Masalah / Catatan Konseling *
                </label>
              </div>
              <textarea
                rows={5}
                required
                value={uraianMasalah}
                onChange={(e) => setUraianMasalah(e.target.value)}
                placeholder="Tuliskan kronologi masalah, keluhan siswa, atau hasil pengamatan..."
                className="w-full min-h-[120px] p-3.5 rounded-[12px] border border-border text-sm leading-relaxed text-text placeholder:text-muted/60 focus:outline-none focus:border-primary shadow-sm resize-y"
              />
            </div>

            {/* Rencana Tindak Lanjut: Lapang */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-text">
                  Rencana Tindak Lanjut & Kesepakatan Solusi
                </label>
                <span className="text-[11px] text-muted">Langkah penanganan berikutnya</span>
              </div>
              <textarea
                rows={3}
                value={tindakLanjut}
                onChange={(e) => setTindakLanjut(e.target.value)}
                placeholder="Contoh: Jadwal konseling lanjutan minggu depan, koordinasi dengan wali kelas, atau pemanggilan orang tua untuk diskusi bersama..."
                className="w-full min-h-[90px] p-3.5 rounded-[14px] border border-border text-[14px] leading-relaxed text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-y shadow-sm"
              />
            </div>

            {/* Status Layanan Pills */}
            <div>
              <label className="block text-xs font-bold text-text mb-2">Status Penanganan</label>
              <div className="flex gap-2">
                {(['Proses', 'Selesai', 'Menunggu'] as const).map((st) => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setStatus(st)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      status === st
                        ? st === 'Selesai'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : st === 'Menunggu'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface text-muted border-border hover:bg-bg'
                    }`}
                  >
                    {st === 'Proses' ? 'Sedang Diproses' : st === 'Selesai' ? 'Kasus Selesai' : 'Menunggu Tindak Lanjut'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tombol Simpan & Batal */}
            <div className="pt-4 border-t border-border flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="min-h-[48px] px-5 rounded-[14px] bg-bg font-bold text-sm text-muted hover:bg-gray-200 transition-colors"
              >
                Ganti Jenis
              </button>
              <button
                type="submit"
                className="min-h-[48px] px-7 rounded-[14px] bg-accent text-white font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all shadow-[0_6px_16px_rgb(15_118_110/0.25)] flex items-center gap-2"
              >
                <Save size={17} />
                <span>Simpan Catatan Layanan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
