import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { exportToCsv } from '../../lib/exportCsv';
import { DetailBar, PageHeader, TableHint, smallBtnCls } from '../ui';
import { DocPreview, PreviewButton, type DocSpec } from '../docPreview';

interface MobileLapbulProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export default function MobileLapbul({ onBack, onToast }: MobileLapbulProps) {
  const { records, settings } = useBK();
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth());
  const [tahun, setTahun] = useState(now.getFullYear());
  const [previewOpen, setPreviewOpen] = useState(false);

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const d = new Date(r.tanggal);
        return d.getMonth() === bulan && d.getFullYear() === tahun;
      }),
    [records, bulan, tahun],
  );

  const stats = {
    klasikal: filtered.filter((r) => r.jenis === 'Bimbingan Klasikal').length,
    kelompok: filtered.filter((r) => r.jenis === 'Konseling Kelompok').length,
    individual: filtered.filter((r) => r.jenis === 'Konseling Individual').length,
    kunjungan: filtered.filter((r) => r.jenis === 'Kunjungan Rumah').length,
    konferensi: filtered.filter((r) => r.jenis === 'Konferensi Kasus').length,
    total: filtered.length,
    proses: filtered.filter((r) => r.status === 'Proses').length,
    selesai: filtered.filter((r) => r.status === 'Selesai').length,
  };

  const bidang = {
    Pribadi: filtered.filter((r) => r.bidang === 'Pribadi').length,
    Sosial: filtered.filter((r) => r.bidang === 'Sosial').length,
    Belajar: filtered.filter((r) => r.bidang === 'Belajar').length,
    Karir: filtered.filter((r) => r.bidang === 'Karir').length,
  };

  const persen = (value: number) =>
    stats.total > 0 ? `${Math.round((value / stats.total) * 100)}%` : '0%';

  const docSpec: DocSpec = useMemo(
    () => ({
      title: 'LAPORAN BULANAN BIMBINGAN DAN KONSELING',
      subtitle: `BULAN ${BULAN[bulan].toUpperCase()} TAHUN ${tahun}`,
      meta: [
        `${settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN ${
          settings.tahunAjaran || '2026/2027'
        }`,
      ],
      signature: true,
      sections: [
        {
          heading: 'I. Statistik Layanan Bimbingan dan Konseling',
          columns: [
            { label: 'JENIS LAYANAN', align: 'left' },
            { label: 'JUMLAH', align: 'center', width: '14%' },
            { label: 'SATUAN', align: 'center', width: '16%' },
            { label: 'KETERANGAN', align: 'left' },
          ],
          rows: [
            ['Bimbingan Klasikal', stats.klasikal, 'Sesi', 'Layanan kelompok di kelas'],
            ['Konseling Kelompok', stats.kelompok, 'Sesi', 'Kelompok kecil (3-8 siswa)'],
            ['Konseling Individual', stats.individual, 'Sesi', 'Bimbingan satu-satu'],
            ['Kunjungan Rumah', stats.kunjungan, 'Kunjungan', 'Home visit'],
            ['Konferensi Kasus', stats.konferensi, 'Sesi', 'Pertemuan lintas pihak'],
          ],
          totalRow: ['TOTAL LAYANAN', stats.total, 'Kegiatan', 'Keseluruhan layanan bulan ini'],
        },
        {
          heading: 'II. Distribusi Bidang Bimbingan',
          columns: [
            { label: 'BIDANG BIMBINGAN', align: 'left' },
            { label: 'JUMLAH KASUS', align: 'center', width: '20%' },
            { label: 'PERSENTASE', align: 'center', width: '20%' },
          ],
          rows: [
            ['Bidang Pribadi', bidang.Pribadi, persen(bidang.Pribadi)],
            ['Bidang Sosial', bidang.Sosial, persen(bidang.Sosial)],
            ['Bidang Belajar', bidang.Belajar, persen(bidang.Belajar)],
            ['Bidang Karir', bidang.Karir, persen(bidang.Karir)],
          ],
        },
        {
          heading: 'III. Status Penanganan Kasus',
          columns: [
            { label: 'STATUS', align: 'left' },
            { label: 'JUMLAH KASUS', align: 'center', width: '30%' },
          ],
          rows: [
            ['Dalam Proses', stats.proses],
            ['Selesai Ditangani', stats.selesai],
          ],
          totalRow: ['TOTAL KASUS', stats.total],
        },
      ],
    }),
    [bulan, tahun, stats, bidang, settings],
  );

  const geser = (arah: -1 | 1) => {
    let b = bulan + arah;
    let t = tahun;
    if (b < 0) {
      b = 11;
      t -= 1;
    } else if (b > 11) {
      b = 0;
      t += 1;
    }
    setBulan(b);
    setTahun(t);
  };

  const exportCsv = () => {
    const headers = ['Jenis Layanan', 'Bulan', 'Tahun', 'Jumlah', 'Keterangan'];
    const rows = [
      ['Bimbingan Klasikal', BULAN[bulan], tahun, stats.klasikal, 'Sesi'],
      ['Konseling Kelompok', BULAN[bulan], tahun, stats.kelompok, 'Sesi'],
      ['Konseling Individual', BULAN[bulan], tahun, stats.individual, 'Sesi'],
      ['Kunjungan Rumah', BULAN[bulan], tahun, stats.kunjungan, 'Kunjungan'],
      ['Konferensi Kasus', BULAN[bulan], tahun, stats.konferensi, 'Sesi'],
      ['TOTAL LAYANAN', BULAN[bulan], tahun, stats.total, 'Kegiatan'],
      ['', '', '', '', ''],
      ['Bidang Pribadi', BULAN[bulan], tahun, bidang.Pribadi, 'Kasus'],
      ['Bidang Sosial', BULAN[bulan], tahun, bidang.Sosial, 'Kasus'],
      ['Bidang Belajar', BULAN[bulan], tahun, bidang.Belajar, 'Kasus'],
      ['Bidang Karir', BULAN[bulan], tahun, bidang.Karir, 'Kasus'],
    ];
    exportToCsv(
      `Laporan_Bulanan_BK_${BULAN[bulan]}_${tahun}_${settings.namaSekolah.replace(/\s+/g, '_')}`,
      headers,
      rows,
    );
    onToast(`Laporan ${BULAN[bulan]} ${tahun} berhasil diekspor.`);
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
        title="Laporan Bulanan"
        subtitle={`${BULAN[bulan]} ${tahun} · ${stats.total} kegiatan`}
      />

      <div className="bk-card flex items-center justify-between !p-3">
        <button
          type="button"
          onClick={() => geser(-1)}
          aria-label="Bulan sebelumnya"
          className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-[15px] font-extrabold text-text">
            {BULAN[bulan]} {tahun}
          </p>
          <p className="text-[11px] font-semibold text-muted">{stats.total} kegiatan tercatat</p>
        </div>
        <button
          type="button"
          onClick={() => geser(1)}
          aria-label="Bulan berikutnya"
          className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted active:scale-95"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dokumen laporan — tabel & susunan sama persis dengan LapbulForm versi PC */}
      <div className="border border-black bg-white p-3.5 text-black shadow-sm">
        <div className="mb-3 border-b-2 border-black pb-2.5 text-center">
          <h2 className="text-[13px] font-extrabold uppercase leading-snug tracking-wide text-black">
            LAPORAN BULANAN BIMBINGAN DAN KONSELING
          </h2>
          <p className="mt-0.5 text-[10px] font-bold leading-snug text-black/80">
            BULAN {BULAN[bulan].toUpperCase()} TAHUN {tahun}
          </p>
          <p className="mt-0.5 text-[10px] font-medium leading-snug text-black/70">
            {settings.namaSekolah || 'SMP NEGERI 1 BINTANG'}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="border-b border-black pb-1 text-[11px] font-extrabold uppercase text-black">
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
                  <th className="border border-black px-3 py-2 text-left">KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50/30">
                  <td className="border border-black px-3 py-2 font-bold">Bimbingan Klasikal</td>
                  <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">
                    {stats.klasikal}
                  </td>
                  <td className="border border-black px-2 py-2 text-center">Sesi</td>
                  <td className="border border-black px-3 py-2">Layanan kelompok di kelas</td>
                </tr>
                <tr className="hover:bg-gray-50/30">
                  <td className="border border-black px-3 py-2 font-bold">Konseling Kelompok</td>
                  <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">
                    {stats.kelompok}
                  </td>
                  <td className="border border-black px-2 py-2 text-center">Sesi</td>
                  <td className="border border-black px-3 py-2">Kelompok kecil (3-8 siswa)</td>
                </tr>
                <tr className="hover:bg-gray-50/30">
                  <td className="border border-black px-3 py-2 font-bold">Konseling Individual</td>
                  <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">
                    {stats.individual}
                  </td>
                  <td className="border border-black px-2 py-2 text-center">Sesi</td>
                  <td className="border border-black px-3 py-2">Bimbingan satu-satu</td>
                </tr>
                <tr className="hover:bg-gray-50/30">
                  <td className="border border-black px-3 py-2 font-bold">Kunjungan Rumah</td>
                  <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">
                    {stats.kunjungan}
                  </td>
                  <td className="border border-black px-2 py-2 text-center">Kunjungan</td>
                  <td className="border border-black px-3 py-2">Home visit</td>
                </tr>
                <tr className="hover:bg-gray-50/30">
                  <td className="border border-black px-3 py-2 font-bold">Konferensi Kasus</td>
                  <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">
                    {stats.konferensi}
                  </td>
                  <td className="border border-black px-2 py-2 text-center">Sesi</td>
                  <td className="border border-black px-3 py-2">Pertemuan lintas pihak</td>
                </tr>
                <tr className="bg-neutral-50 font-extrabold">
                  <td className="border border-black px-3 py-2 uppercase text-black">Total Layanan</td>
                  <td className="border border-black px-2 py-2 text-center text-base font-black text-black">
                    {stats.total}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-bold">Kegiatan</td>
                  <td className="border border-black px-3 py-2 font-bold text-neutral-800">
                    Keseluruhan layanan bulan ini
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="border-b border-black pb-1 pt-2 text-[11px] font-extrabold uppercase text-black">
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

          <h3 className="border-b border-black pb-1 pt-2 text-[11px] font-extrabold uppercase text-black">
            III. STATUS PENANGANAN KASUS
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="border border-black p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-gray-700">Dalam Proses</p>
              <p className="text-2xl font-black text-primary">{stats.proses}</p>
              <p className="text-[10px] text-muted">Kasus</p>
            </div>
            <div className="border border-black p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-gray-700">Selesai Ditangani</p>
              <p className="text-2xl font-black text-primary">{stats.selesai}</p>
              <p className="text-[10px] text-muted">Kasus</p>
            </div>
            <div className="border border-black p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-gray-700">Total Kasus</p>
              <p className="text-2xl font-black text-neutral-800">{stats.total}</p>
              <p className="text-[10px] text-muted">Kasus</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-black/30 pt-2.5 text-[10px] text-muted">
          <p>Laporan Bulanan BK – {settings.tahunAjaran || '2026/2027'}</p>
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
