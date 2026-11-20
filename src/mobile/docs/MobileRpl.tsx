import { useMemo, useState } from 'react';
import { BookOpen, Printer, Save, Sparkles } from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { DetailBar, Field, PageHeader, inputCls, smallBtnCls, textareaCls } from '../ui';
import { DocPreview, PreviewButton, type DocSpec } from '../docPreview';

interface MobileRplProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const KOMPONEN = ['Layanan Dasar', 'Layanan Responsif', 'Peminatan & Perencanaan', 'Dukungan Sistem'];
const BIDANG = ['Pribadi', 'Sosial', 'Belajar', 'Karir'] as const;

const TEMPLATE = [
  {
    topik: 'Cerdas dan Bijak Menggunakan Gawai & Media Sosial',
    bidang: 'Pribadi' as const,
    tujuan:
      'Peserta didik mampu mengenali dampak positif dan negatif penggunaan gawai, serta menyusun aturan penggunaan yang sehat.',
    inti:
      '1. Pemutaran video singkat tentang jejak digital.\n2. Diskusi kelompok: kebiasaan penggunaan gawai sehari-hari.\n3. Menyusun kesepakatan kelas tentang penggunaan gawai yang sehat.',
  },
  {
    topik: 'Strategi Belajar Efektif Menjelang Ujian',
    bidang: 'Belajar' as const,
    tujuan:
      'Peserta didik mampu menyusun jadwal belajar yang realistis dan menerapkan teknik belajar aktif.',
    inti:
      '1. Pemetaan waktu belajar mingguan.\n2. Praktik teknik Pomodoro dan membuat ringkasan.\n3. Refleksi hambatan belajar dan solusinya.',
  },
  {
    topik: 'Mengenal Pilihan Sekolah Lanjutan (SMA/SMK/MA)',
    bidang: 'Karir' as const,
    tujuan:
      'Peserta didik memahami perbedaan jalur SMA, SMK, dan MA serta mampu menentukan pilihan sesuai minat dan bakat.',
    inti:
      '1. Paparan singkat jalur pendidikan menengah.\n2. Diskusi minat dan bakat tiap siswa.\n3. Menuliskan rencana pilihan 1 dan pilihan 2.',
  },
];

export default function MobileRpl({ onBack, onToast }: MobileRplProps) {
  const { settings } = useBK();
  const [komponen, setKomponen] = useState('Layanan Dasar');
  const [bidang, setBidang] = useState<(typeof BIDANG)[number]>('Pribadi');
  const [topik, setTopik] = useState(TEMPLATE[0].topik);
  const [kelas, setKelas] = useState('Kelas 8');
  const [alokasi, setAlokasi] = useState('1 Pertemuan x 40 Menit');
  const [tujuan, setTujuan] = useState(TEMPLATE[0].tujuan);
  const [inti, setInti] = useState(TEMPLATE[0].inti);
  const [previewOpen, setPreviewOpen] = useState(false);

  const docSpec: DocSpec = useMemo(
    () => ({
      title: 'RENCANA PELAKSANAAN LAYANAN (RPL)',
      subtitle: 'BIMBINGAN & KONSELING',
      meta: [
        `${settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN ${
          settings.tahunAjaran || '2026/2027'
        }`,
      ],
      signature: true,
      sections: [
        {
          heading: 'A. Identitas Layanan',
          facts: [
            ['Komponen Layanan', komponen],
            ['Bidang Layanan', bidang],
            ['Topik Layanan', topik || '-'],
            ['Sasaran', kelas || '-'],
            ['Alokasi Waktu', alokasi || '-'],
          ],
        },
        {
          heading: 'B. Tujuan Layanan',
          paragraphs: [tujuan || '-'],
        },
        {
          heading: 'C. Kegiatan Inti',
          paragraphs: inti.split('\n').filter((line) => line.trim().length > 0),
        },
      ],
    }),
    [komponen, bidang, topik, kelas, alokasi, tujuan, inti, settings],
  );

  const pakaiTemplate = (t: (typeof TEMPLATE)[number]) => {
    setTopik(t.topik);
    setBidang(t.bidang);
    setTujuan(t.tujuan);
    setInti(t.inti);
    onToast(`Template "${t.topik}" dimuat.`);
  };

  return (
    <div className="fade-up space-y-4">
      <DetailBar
        onBack={onBack}
        label="Dokumen"
        right={
          <div className="flex items-center gap-1.5">
            <PreviewButton onClick={() => setPreviewOpen(true)} />
            <button
              type="button"
              onClick={() => onToast('RPL berhasil disimpan.')}
              className={smallBtnCls}
            >
              <Save size={14} /> Simpan
            </button>
          </div>
        }
      />

      <PageHeader
        title="RPL 1-Lembar"
        subtitle={`Bimbingan klasikal · ${settings.namaSekolah || 'SIM BK PRO'}`}
      />

      <section className="bk-card space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles size={15} className="text-accent" />
          <h2 className="text-[13px] font-bold text-text">Contoh topik populer</h2>
        </div>
        <div className="grid gap-2">
          {TEMPLATE.map((t) => (
            <button
              key={t.topik}
              type="button"
              onClick={() => pakaiTemplate(t)}
              className="rounded-[12px] border border-border bg-surface px-3 py-2 text-left text-[12px] font-semibold leading-snug text-text active:bg-primary-tint"
            >
              <span className="mr-1.5 rounded-full bg-primary-tint px-1.5 py-0.5 text-[10px] font-bold text-accent">
                {t.bidang}
              </span>
              {t.topik}
            </button>
          ))}
        </div>
      </section>

      <section className="bk-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2.5">
          <BookOpen size={16} className="text-accent" />
          <h2 className="text-[15px] font-bold text-text">Rincian RPL</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Komponen">
            <select value={komponen} onChange={(e) => setKomponen(e.target.value)} className={inputCls}>
              {KOMPONEN.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bidang">
            <select
              value={bidang}
              onChange={(e) => setBidang(e.target.value as (typeof BIDANG)[number])}
              className={inputCls}
            >
              {BIDANG.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Topik layanan">
          <input value={topik} onChange={(e) => setTopik(e.target.value)} className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sasaran kelas">
            <input value={kelas} onChange={(e) => setKelas(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Alokasi waktu">
            <input value={alokasi} onChange={(e) => setAlokasi(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field label="Tujuan layanan">
          <textarea
            rows={3}
            value={tujuan}
            onChange={(e) => setTujuan(e.target.value)}
            className={textareaCls}
          />
        </Field>

        <Field label="Langkah kegiatan inti">
          <textarea
            rows={6}
            value={inti}
            onChange={(e) => setInti(e.target.value)}
            className={`${textareaCls} min-h-[150px]`}
          />
        </Field>
      </section>

      <section className="bk-card space-y-1.5">
        <h2 className="text-[13px] font-bold text-text">Ringkasan</h2>
        <p className="text-[12px] leading-relaxed text-muted">
          {komponen} · Bidang {bidang} · {kelas} · {alokasi}
        </p>
        <p className="text-[12px] font-semibold leading-snug text-text">{topik}</p>
      </section>

      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="bk-btn primary min-h-[48px] w-full"
      >
        <Printer size={15} /> Pratinjau &amp; Cetak Dokumen
      </button>

      <DocPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        spec={docSpec}
        settings={settings}
      />
    </div>
  );
}
