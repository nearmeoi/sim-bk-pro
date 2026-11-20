import { useEffect, useRef, useState } from 'react';
import {
  Check,
  HardDriveDownload,
  Image as ImageIcon,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  School,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  UserCheck,
} from 'lucide-react';
import { useBK } from '../context/BKContext';
import { confirmDialog } from '../components/ui/ConfirmModal';
import type { SchoolSettings } from '../types';
import { DetailBar, Field, PageHeader, inputCls, smallBtnCls, textareaCls } from './ui';
import { THEME_COLORS, THEME_MODES, useTheme, type ThemeMode } from './theme';

interface MobilePengaturanProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const compressImage = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 240;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(event.target?.result ?? ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(String(event.target?.result ?? ''));
      img.src = String(event.target?.result ?? '');
    };
    reader.readAsDataURL(file);
  });

export default function MobilePengaturan({ onBack, onToast }: MobilePengaturanProps) {
  const {
    settings: saved,
    updateSettings,
    resetAllData,
    downloadDataBackup,
    restoreDataBackup,
  } = useBK();
  const [form, setForm] = useState<SchoolSettings>(saved);
  const logoKiri = useRef<HTMLInputElement>(null);
  const logoKanan = useRef<HTMLInputElement>(null);
  const restoreInput = useRef<HTMLInputElement>(null);
  const { color, mode, setColor, setMode, reset: resetTheme } = useTheme();

  useEffect(() => setForm(saved), [saved]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof SchoolSettings>(field: K, value: SchoolSettings[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const uploadLogo = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'logoKananUrl',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onToast('Ukuran gambar logo maksimal 5 MB.');
      return;
    }
    const compressed = await compressImage(file);
    set(field, compressed);
    onToast('Logo berhasil dimuat dan dioptimasi.');
  };

  const simpan = () => {
    updateSettings(form);
    onToast('Pengaturan sekolah dan kop surat disimpan.');
  };

  const reset = async () => {
    const ok = await confirmDialog({
      title: 'Kembalikan semua data ke setelan awal?',
      description: 'Siswa, catatan, dan dokumen akan dihapus dari perangkat ini.',
      confirmLabel: 'Ya, Reset',
      tone: 'danger',
    });
    if (!ok) return;
    resetAllData();
    onToast('Semua data dikembalikan ke setelan awal.');
  };

  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await restoreDataBackup(file);
    onToast(result.success ? 'Data berhasil dikembalikan.' : result.error || 'Gagal memulihkan data.');
    if (restoreInput.current) restoreInput.current.value = '';
  };

  return (
    <div className="fade-up space-y-4 pb-6">
      <DetailBar
        onBack={onBack}
        label="Menu"
        right={
          <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[10px] font-bold text-accent">
            {isDirty ? 'Belum disimpan' : 'Tersimpan'}
          </span>
        }
      />

      <PageHeader
        title="Pengaturan"
        subtitle="Tema, kop surat, identitas sekolah, dan data aplikasi"
      />

      {/* Tema tampilan */}
      <section className="bk-card space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-primary-tint text-primary">
            <Palette size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold text-text">Tema Tampilan</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              Warna aksen dinamis dan mode terang/gelap.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
            Warna Aksen
          </p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_COLORS.map((c) => {
              const active = color === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1.5 rounded-[14px] border px-1 py-2.5 transition ${
                    active ? 'border-primary bg-primary-tint' : 'border-border bg-surface'
                  }`}
                >
                  <span
                    className="grid h-7 w-7 flex-none place-items-center rounded-full text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${c.swatch}, ${c.swatch2})`,
                    }}
                  >
                    {active && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span
                    className={`max-w-full truncate text-[11px] font-bold ${
                      active ? 'text-accent' : 'text-text'
                    }`}
                  >
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
            Mode Tampilan
          </p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_MODES.map((m) => {
              const active = mode === m.id;
              const Icon = m.id === 'dark' ? Moon : m.id === 'system' ? Monitor : Sun;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as ThemeMode)}
                  aria-pressed={active}
                  className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-[12px] border text-[12px] font-bold transition ${
                    active
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-surface text-muted'
                  }`}
                >
                  <Icon size={15} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={resetTheme}
          className="bk-btn ghost min-h-[42px] w-full !text-[13px]"
        >
          <RotateCcw size={14} /> Kembalikan tema bawaan
        </button>
      </section>

      {/* Cadangan data */}
      <section className="bk-card space-y-3">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-primary-tint text-primary">
            <HardDriveDownload size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-text">Cadangkan & Kembalikan Data</h2>
            <p className="mt-0.5 text-[11px] text-muted">Simpan salinan data ke berkas JSON.</p>
          </div>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={downloadDataBackup}
            className="bk-btn ghost min-h-[46px] w-full"
          >
            <HardDriveDownload size={15} /> Unduh Cadangan
          </button>
          <button
            type="button"
            onClick={() => restoreInput.current?.click()}
            className="bk-btn ghost min-h-[46px] w-full"
          >
            <Upload size={15} /> Kembalikan dari Cadangan
          </button>
          <input
            ref={restoreInput}
            type="file"
            accept="application/json,.json"
            onChange={restore}
            className="hidden"
          />
          <button
            type="button"
            onClick={reset}
            className="bk-btn ghost min-h-[46px] w-full !text-alert"
          >
            <Trash2 size={15} /> Reset Semua Data
          </button>
        </div>
      </section>

      {/* Kop surat */}
      <section className="bk-card space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-primary-tint text-primary">
            <School size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-text">Kop Surat & Logo Sekolah</h2>
            <p className="mt-0.5 text-[11px] text-muted">Identitas pada kepala dokumen resmi.</p>
          </div>
        </div>

        <div className="grid gap-3">
          {(
            [
              {
                key: 'logoUrl' as const,
                label: 'Logo Sisi Kiri',
                hint: 'Pemda / yayasan / sekolah',
                ref: logoKiri,
              },
              {
                key: 'logoKananUrl' as const,
                label: 'Logo Sisi Kanan',
                hint: 'Tut Wuri Handayani / Kemenag',
                ref: logoKanan,
              },
            ]
          ).map((logo) => (
            <div key={logo.key} className="rounded-[14px] border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-[12px] border border-dashed border-border bg-white">
                  {form[logo.key] ? (
                    <img src={form[logo.key]} alt={logo.label} className="h-full w-full object-contain p-1" />
                  ) : (
                    <ImageIcon size={20} className="text-muted/50" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-text">{logo.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{logo.hint}</p>
                </div>
              </div>
              <div className="mt-2.5 flex gap-2">
                <input
                  ref={logo.ref}
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadLogo(e, logo.key)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logo.ref.current?.click()}
                  className={`${smallBtnCls} flex-1`}
                >
                  <Upload size={14} /> {form[logo.key] ? 'Ganti' : 'Unggah'}
                </button>
                {form[logo.key] && (
                  <button
                    type="button"
                    onClick={() => {
                      set(logo.key, '');
                      onToast(`${logo.label} dikembalikan ke default.`);
                    }}
                    className={`${smallBtnCls} !text-alert`}
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Field label="Instansi Pembina / Dinas / Yayasan">
          <input
            value={form.instansiAtas || ''}
            onChange={(e) => set('instansiAtas', e.target.value)}
            placeholder="PEMERINTAH KOTA MAKASSAR"
            className={inputCls}
          />
        </Field>

        <Field label="Nama Lengkap Satuan Pendidikan *">
          <input
            value={form.namaSekolah}
            onChange={(e) => set('namaSekolah', e.target.value)}
            placeholder="UPT SPF Nama Sekolah"
            className={`${inputCls} font-bold`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="NPSN">
            <input
              value={form.npsn}
              onChange={(e) => set('npsn', e.target.value)}
              placeholder="40307348"
              className={inputCls}
            />
          </Field>
          <Field label="Tahun Ajaran">
            <input
              value={form.tahunAjaran}
              onChange={(e) => set('tahunAjaran', e.target.value)}
              placeholder="2026/2027"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Kota Titimangsa Surat">
          <input
            value={form.kotaSurat || ''}
            onChange={(e) => set('kotaSurat', e.target.value)}
            placeholder="Makassar"
            className={inputCls}
          />
        </Field>

        <Field label="Alamat Lengkap">
          <textarea
            rows={2}
            value={form.alamat}
            onChange={(e) => set('alamat', e.target.value)}
            placeholder="Jalan, kelurahan, kecamatan, kota, kode pos"
            className={textareaCls}
          />
        </Field>

        <Field label="Telepon / Fax Sekolah">
          <input
            value={form.teleponSekolah || ''}
            onChange={(e) => set('teleponSekolah', e.target.value)}
            placeholder="Telp. 0411…"
            className={inputCls}
          />
        </Field>

        <Field label="Email / Website Sekolah">
          <input
            value={form.emailSekolah || ''}
            onChange={(e) => set('emailSekolah', e.target.value)}
            placeholder="sekolah@email.com"
            className={inputCls}
          />
        </Field>
      </section>

      {/* Pejabat */}
      <section className="bk-card space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-accent-tint text-accent">
            <UserCheck size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-text">Pejabat & Penandatangan</h2>
            <p className="mt-0.5 text-[11px] text-muted">Nama yang tercetak pada lembar pengesahan.</p>
          </div>
        </div>

        <Field label="Nama Kepala Sekolah">
          <input
            value={form.kepalaSekolah}
            onChange={(e) => set('kepalaSekolah', e.target.value)}
            placeholder="Nama lengkap dan gelar"
            className={inputCls}
          />
        </Field>
        <Field label="NIP Kepala Sekolah">
          <input
            value={form.nipKepala}
            onChange={(e) => set('nipKepala', e.target.value)}
            placeholder="19750101 200003 1 001"
            className={inputCls}
          />
        </Field>
        <Field label="Nama Guru BK / Konselor">
          <input
            value={form.guruBK}
            onChange={(e) => set('guruBK', e.target.value)}
            placeholder="Nama lengkap dan gelar"
            className={inputCls}
          />
        </Field>
        <Field label="NIP Guru BK / Konselor">
          <input
            value={form.nipGuruBK}
            onChange={(e) => set('nipGuruBK', e.target.value)}
            placeholder="19880512 201402 2 003"
            className={inputCls}
          />
        </Field>
      </section>

      <div className="bk-card flex items-start gap-3">
        <ShieldCheck size={18} className="mt-0.5 flex-none text-[#047857]" />
        <p className="text-[11px] font-semibold leading-relaxed text-muted">
          Perubahan langsung tersimpan di perangkat ini dan disinkronkan ke cloud. Versi PC akan
          memakai data yang sama.
        </p>
      </div>

      {isDirty && (
        <div className="sticky bottom-24 z-20">
          <button type="button" onClick={simpan} className="bk-btn primary min-h-[50px] w-full shadow-lg">
            <Save size={16} /> Simpan Pengaturan
          </button>
        </div>
      )}
    </div>
  );
}
