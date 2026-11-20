import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { exportToCsv } from '../../lib/exportCsv';
import { DetailBar, PageHeader, TableHint, smallBtnCls } from '../ui';
import { DocPreview, PreviewButton, type DocSpec } from '../docPreview';

interface MobileLapsemProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

export default function MobileLapsem({ onBack, onToast }: MobileLapsemProps) {
  const { records, cases, settings } = useBK();
  const [semester, setSemester] = useState<'1' | '2'>('1');
  const [tahunAjaran, setTahunAjaran] = useState(settings.tahunAjaran || '2026/2027');
  const [previewOpen, setPreviewOpen] = useState(false);

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const month = new Date(r.tanggal).getMonth();
        const ganjil = month >= 6 && month <= 11;
        const genap = month >= 0 && month <= 5;
        return semester === '1' ? ganjil : genap;
      }),
    [records, semester],
  );

  const stats = {
    klasikal: filtered.filter((r) => r.jenis === 'Bimbingan Klasikal').length,
    kelompok: filtered.filter((r) => r.jenis === 'Konseling Kelompok').length,
    individual: filtered.filter((r) => r.jenis === 'Konseling Individual').length,
    kunjungan: filtered.filter((r) => r.jenis === 'Kunjungan Rumah').length,
    konferensi: filtered.filter((r) => r.jenis === 'Konferensi Kasus').length,
    total: filtered.length,
  };

  const bidang = {
    Pribadi: filtered.filter((r) => r.bidang === 'Pribadi').length,
    Sosial: filtered.filter((r) => r.bidang === 'Sosial').length,
    Belajar: filtered.filter((r) => r.bidang === 'Belajar').length,
    Karir: filtered.filter((r) => r.bidang === 'Karir').length,
  };

  const kasus = {
    total: cases.length,
    proses: cases.filter((c) => c.status === 'Proses').length,
    selesai: cases.filter((c) => c.status === 'Selesai').length,
  };

  const siswaLayanan = new Set(filtered.map((r) => r.studentId)).size;
  const label = semester === '1' ? 'Ganjil' : 'Genap';

  const persen = (value: number) =>
    stats.total > 0 ? `${Math.round((value / stats.total) * 100)}%` : '0%';

  const docSpec: DocSpec = useMemo(
    () => ({
      title: 'LAPORAN SEMESTER BIMBINGAN DAN KONSELING',
      subtitle: `SEMESTER ${label.toUpperCase()} TAHUN AJARAN ${tahunAjaran}`,
      meta: [settings.namaSekolah || 'SIM BK PRO'],
      signature: true,
      sections: [
        {
          heading: 'I. Statistik Layanan Bimbingan dan Konseling',
          columns: [
            { label: 'JENIS LAYANAN', align: 'left' },
            { label: 'JUMLAH', align: 'center', width: '18%' },
            { label: 'SATUAN', align: 'center', width: '20%' },
          ],
          rows: [
            ['Bimbingan Klasikal', stats.klasikal, 'Sesi'],
            ['Konseling Kelompok', stats.kelompok, 'Sesi'],
            ['Konseling Individual', stats.individual, 'Sesi'],
            ['Kunjungan Rumah', stats.kunjungan, 'Kunjungan'],
            ['Konferensi Kasus', stats.konferensi, 'Sesi'],
          ],
          totalRow: ['TOTAL LAYANAN', stats.total, 'Kegiatan'],
        },
        {
          heading: 'II. Distribusi Bidang Bimbingan',
          columns: [
            { label: 'BIDANG BIMBINGAN', align: 'left' },
            { label: 'JUMLAH KASUS', align: 'center', width: '22%' },
            { label: 'PERSENTASE', align: 'center', width: '22%' },
          ],
          rows: [
            ['Bidang Pribadi', bidang.Pribadi, persen(bidang.Pribadi)],
            ['Bidang Sosial', bidang.Sosial, persen(bidang.Sosial)],
            ['Bidang Belajar', bidang.Belajar, persen(bidang.Belajar)],
            ['Bidang Karir', bidang.Karir, persen(bidang.Karir)],
          ],
        },
        {
          heading: 'III. Ringkasan Pelaksanaan',
          facts: [
            ['Total Siswa Layanan', `${siswaLayanan} siswa`],
            [
              'Rata-rata Layanan per Siswa',
              `${siswaLayanan > 0 ? (stats.total / siswaLayanan).toFixed(1) : '0'} kegiatan`,
            ],
            [
              'Cakupan Layanan',
              `${siswaLayanan > 0 ? Math.round((siswaLayanan / 100) * 100) : 0}% (estimatif)`,
            ],
            ['Kasus Ditangani', `${kasus.total} kasus (${kasus.proses} proses, ${kasus.selesai} selesai)`],
          ],
        },
        {
          heading: 'IV. Evaluasi Program Semester',
          paragraphs: [
            `A. Pencapaian Program — Program bimbingan semester ${
              semester === '1' ? 'ganjil' : 'genap'
            } telah dilaksanakan sesuai dengan rencana yang telah ditetapkan. Layanan klasikal, konseling kelompok, dan individual telah diberikan kepada siswa sesuai kebutuhan.`,
            'B. Kendala dan Hambatan — Beberapa kendala yang dihadapi meliputi: keterbatasan waktu untuk kunjungan rumah, sulit mengkoordinir siswa yang mengikuti kegiatan ekstrakurikuler bersamaan dengan layanan bimbingan, dan kondisi siswa yang memiliki tingkat kehadiran tidak konsisten.',
            'C. Rencana Tindak Lanjut — Untuk semester berikutnya, akan ditingkatkan koordinasi dengan wali kelas dan orang tua, serta diperkuat layanan bimbingan berbasis teknologi untuk mempermudah akses siswa.',
          ],
        },
        {
          heading: 'V. Rekomendasi',
          paragraphs: [
            '1. Memperkuat kerjasama dengan orang tua siswa melalui pertemuan rutin (PPK).',
            '2. Meningkatkan koordinasi dengan wali kelas dalam mengidentifikasi siswa berisiko.',
            '3. Memberikan pelatihan teknologi informasi untuk layanan bimbingan modern.',
            '4. Memperbanyak materi bimbingan berbasis kasus nyata dan studi kasus.',
          ],
        },
      ],
    }),
    [bidang, kasus, label, semester, settings.namaSekolah, siswaLayanan, stats, tahunAjaran],
  );

  const exportCsv = () => {
    const headers = ['Indikator', 'Semester', 'Tahun Ajaran', 'Jumlah', 'Satuan'];
    const rows = [
      ['Bimbingan Klasikal', label, tahunAjaran, stats.klasikal, 'Sesi'],
      ['Konseling Kelompok', label, tahunAjaran, stats.kelompok, 'Sesi'],
      ['Konseling Individual', label, tahunAjaran, stats.individual, 'Sesi'],
      ['Kunjungan Rumah', label, tahunAjaran, stats.kunjungan, 'Kunjungan'],
      ['Konferensi Kasus', label, tahunAjaran, stats.konferensi, 'Sesi'],
      ['Total Layanan', label, tahunAjaran, stats.total, 'Kegiatan'],
      ['Siswa Layanan', label, tahunAjaran, siswaLayanan, 'Siswa'],
      ['', '', '', '', ''],
      ['Bidang Pribadi', label, tahunAjaran, bidang.Pribadi, 'Kasus'],
      ['Bidang Sosial', label, tahunAjaran, bidang.Sosial, 'Kasus'],
      ['Bidang Belajar', label, tahunAjaran, bidang.Belajar, 'Kasus'],
      ['Bidang Karir', label, tahunAjaran, bidang.Karir, 'Kasus'],
      ['Kasus Proses', label, tahunAjaran, kasus.proses, 'Kasus'],
      ['Kasus Selesai', label, tahunAjaran, kasus.selesai, 'Kasus'],
    ];
    exportToCsv(
      `Laporan_Semester_${label}_${tahunAjaran.replace('/', '-')}_${settings.namaSekolah.replace(/\s+/g, '_')}`,
      headers,
      rows,
    );
    onToast(`Laporan semester ${label} berhasil diekspor.`);
  };

  return (
    <div className="fade-up space-y-4">
      <DetailBar
        onBack={onBack}
        label="Dokumen"
        right={
          <div className="flex items-center gap-1.5">
            <PreviewButton onClick={() => setPreviewOpen(true)} />
            <button type="button" onClick={exportCsv} className={smallBtnCls}>
              <Download size={14} /> Excel
            </button>
          </div>
        }
      />

      <PageHeader
        title="Laporan Semester"
        subtitle={`Semester ${label} · ${tahunAjaran} · ${stats.total} kegiatan`}
      />

      <div className="grid grid-cols-2 gap-1 rounded-[14px] bg-black/[0.04] p-1">
        {(['1', '2'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSemester(s)}
            aria-pressed={semester === s}
            className={`min-h-[42px] rounded-[11px] text-xs font-bold transition-all ${
              semester === s ? 'bg-surface text-text shadow-sm' : 'text-muted'
            }`}
          >
            Semester {s === '1' ? 'Ganjil' : 'Genap'}
          </button>
        ))}
      </div>

      <div className="bk-card !p-3.5">
        <label className="mb-1 block text-[11px] font-bold text-muted">Tahun ajaran</label>
        <input
          value={tahunAjaran}
          onChange={(e) => setTahunAjaran(e.target.value)}
          className="w-full min-h-[46px] rounded-[12px] border border-border bg-surface px-3.5 text-sm font-semibold text-text focus:border-primary focus:outline-none"
        />
      </div>

      {/* Dokumen laporan — tabel & susunan sama persis dengan LapsemForm versi PC */}
      <div className="border border-black bg-white p-3.5 text-black shadow-sm">
        <div className="mb-3 border-b-2 border-black pb-2.5 text-center">
          <h2 className="text-[13px] font-extrabold uppercase leading-snug tracking-wide text-black">
            LAPORAN SEMESTER BIMBINGAN DAN KONSELING
          </h2>
          <p className="mt-0.5 text-[10px] font-bold leading-snug text-black/80">
            {semester === '1' ? 'SEMESTER GANJIL' : 'SEMESTER GENAP'} TAHUN AJARAN {tahunAjaran}
          </p>
          <p className="mt-0.5 text-[10px] font-medium leading-snug text-black/70">
            {settings.namaSekolah || 'SMP NEGERI 1 BINTANG'}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="border-b border-black pb-2 text-[11px] font-extrabold uppercase text-black">
            I. STATISTIK LAYANAN BIMBINGAN DAN KONSELING
          </h3>
          <TableHint className="!text-black/55" />
          <div className="-mx-3.5 overflow-x-auto border-t border-black">
            <table className="w-full min-w-[500px] border-collapse border border-black text-[12px]">
              <thead>
                <tr className="bg-gray-100 font-extrabold uppercase text-black">
                  <th className="border border-black px-3 py-2 text-left">JENIS LAYANAN</th>
                  <th className="w-20 border border-black px-2 py-2 text-center">JUMLAH</th>
                  <th className="w-24 border border-black px-2 py-2 text-center">SATUAN</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Bimbingan Klasikal', value: stats.klasikal, satuan: 'Sesi' },
                  { label: 'Konseling Kelompok', value: stats.kelompok, satuan: 'Sesi' },
                  { label: 'Konseling Individual', value: stats.individual, satuan: 'Sesi' },
                  { label: 'Kunjungan Rumah', value: stats.kunjungan, satuan: 'Kunjungan' },
                  { label: 'Konferensi Kasus', value: stats.konferensi, satuan: 'Sesi' },
                ].map((row) => (
                  <tr key={row.label} className="hover:bg-gray-50/30">
                    <td className="border border-black px-3 py-2 font-bold">{row.label}</td>
                    <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">
                      {row.value}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">{row.satuan}</td>
                  </tr>
                ))}
                <tr className="bg-neutral-50 font-extrabold">
                  <td className="border border-black px-3 py-2 uppercase text-black">Total Layanan</td>
                  <td className="border border-black px-2 py-2 text-center text-base font-black text-black">
                    {stats.total}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-bold">Kegiatan</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="border-b border-black pb-2 pt-2 text-[11px] font-extrabold uppercase text-black">
            II. DISTRIBUSI BIDANG BIMBINGAN
          </h3>
          <TableHint className="!text-black/55" />
          <div className="-mx-3.5 overflow-x-auto border-t border-black">
            <table className="w-full min-w-[500px] border-collapse border border-black text-[12px]">
              <thead>
                <tr className="bg-gray-100 font-extrabold uppercase text-black">
                  <th className="border border-black px-3 py-2 text-left">BIDANG BIMBINGAN</th>
                  <th className="w-20 border border-black px-2 py-2 text-center">JUMLAH KASUS</th>
                  <th className="w-24 border border-black px-2 py-2 text-center">PERSENTASE</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Bidang Pribadi', value: bidang.Pribadi },
                  { label: 'Bidang Sosial', value: bidang.Sosial },
                  { label: 'Bidang Belajar', value: bidang.Belajar },
                  { label: 'Bidang Karir', value: bidang.Karir },
                ].map((row) => (
                  <tr key={row.label} className="hover:bg-gray-50/30">
                    <td className="border border-black px-3 py-2 font-bold">{row.label}</td>
                    <td className="border border-black px-2 py-2 text-center font-bold">
                      {row.value}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      {stats.total > 0 ? Math.round((row.value / stats.total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="border border-black p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-gray-700">Total Siswa Layanan</p>
              <p className="text-2xl font-black text-neutral-800">{siswaLayanan}</p>
              <p className="text-[10px] text-muted">Siswa</p>
            </div>
            <div className="border border-black p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-gray-700">Rata-rata Layanan/Siswa</p>
              <p className="text-2xl font-black text-primary">
                {siswaLayanan > 0 ? (stats.total / siswaLayanan).toFixed(1) : '0'}
              </p>
              <p className="text-[10px] text-muted">Kegiatan</p>
            </div>
            <div className="border border-black p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-gray-700">Cakupan Layanan</p>
              <p className="text-2xl font-black text-neutral-800">
                {siswaLayanan > 0 ? Math.round((siswaLayanan / 100) * 100) : 0}%
              </p>
              <p className="text-[10px] text-muted">estimatif</p>
            </div>
          </div>

          <div className="rounded-[12px] border border-neutral-300 bg-neutral-50 p-4">
            <h4 className="mb-2 text-[11px] font-extrabold uppercase text-neutral-900">
              III. EVALUASI PROGRAM SEMESTER
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="block text-[11px] font-bold text-neutral-900">
                  A. Pencapaian Program
                </p>
                <p className="text-[11px] leading-relaxed text-text">
                  Program bimbingan semester {semester === '1' ? 'ganjil' : 'genap'} telah
                  dilaksanakan sesuai dengan rencana yang telah ditetapkan. Layanan klasikal,
                  konseling kelompok, dan individual telah diberikan kepada siswa sesuai kebutuhan.
                </p>
              </div>
              <div className="space-y-1">
                <p className="block text-[11px] font-bold text-neutral-900">
                  B. Kendala dan Hambatan
                </p>
                <p className="text-[11px] leading-relaxed text-text">
                  Beberapa kendala yang dihadapi meliputi: keterbatasan waktu untuk kunjungan rumah,
                  sulit mengkoordinir siswa yang mengikuti kegiatan ekstrakurikuler bersamaan dengan
                  layanan bimbingan, dan kondisi siswa yang memiliki tingkat kehadiran tidak
                  konsisten.
                </p>
              </div>
              <div className="space-y-1">
                <p className="block text-[11px] font-bold text-neutral-900">
                  C. Rencana Tindak Lanjut
                </p>
                <p className="text-[11px] leading-relaxed text-text">
                  Untuk semester berikutnya, akan ditingkatkan koordinasi dengan wali kelas dan orang
                  tua, serta diperkuat layanan bimbingan berbasis teknologi untuk mempermudah akses
                  siswa.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] border border-primary bg-primary-tint p-4">
            <h4 className="mb-2 text-[11px] font-extrabold uppercase text-primary">
              IV. REKOMENDASI
            </h4>
            <ul className="space-y-2 text-[11px] text-text">
              {[
                'Memperkuat kerjasama dengan orang tua siswa melalui pertemuan rutin (PPK)',
                'Meningkatkan koordinasi dengan wali kelas dalam mengidentifikasi siswa berisiko',
                'Memberikan pelatihan teknologi informasi untuk layanan bimbingan modern',
                'Memperbanyak materi bimbingan berbasis kasus nyata dan studi kasus',
              ].map((item, i) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="font-bold">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-black/30 pt-2.5 text-[10px] text-muted">
          <p>Laporan Semester BK – {tahunAjaran}</p>
          <p className="font-semibold text-text">{settings.namaSekolah || 'SMP Negeri 1 Bintang'}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="bk-btn ghost min-h-[48px] w-full"
      >
        Pratinjau &amp; Cetak Dokumen
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
