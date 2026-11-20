import { useMemo, useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { exportToCsv } from '../../lib/exportCsv';
import type { JurnalRow } from '../../types';
import { DetailBar, PageHeader, TableHint, smallBtnCls } from '../ui';
import { DocPreview, PreviewButton, type DocSpec } from '../docPreview';

interface MobileJurnalProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const JENIS = [
  'Konseling Individual',
  'Kunjungan Rumah',
  'Konferensi Kasus',
  'Bimbingan Klasikal',
  'Bimbingan Kelompok',
  'Rapat/Koordinasi',
];

export default function MobileJurnal({ onBack, onToast }: MobileJurnalProps) {
  const { jurnalRows: rows, addJurnalRow, updateJurnalRow, deleteJurnalRow, settings } = useBK();
  const [previewOpen, setPreviewOpen] = useState(false);

  const docSpec: DocSpec = useMemo(
    () => ({
      title: 'JURNAL HARIAN KEGIATAN',
      subtitle: 'BIMBINGAN & KONSELING',
      meta: [
        `${settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN ${
          settings.tahunAjaran || '2026/2027'
        }`,
        `${rows.length} kegiatan tercatat`,
      ],
      landscape: true,
      signature: true,
      sections: [
        {
          columns: [
            { label: 'NO', align: 'center', width: '4%' },
            { label: 'HARI & TANGGAL', align: 'left', width: '13%' },
            { label: 'WAKTU', align: 'center', width: '7%' },
            { label: 'NAMA SISWA / SASARAN', align: 'left', width: '14%' },
            { label: 'KELAS', align: 'center', width: '6%' },
            { label: 'JENIS LAYANAN', align: 'left', width: '13%' },
            { label: 'URAIAN KEGIATAN & MASALAH', align: 'left' },
            { label: 'TINDAK LANJUT', align: 'left', width: '14%' },
          ],
          rows: rows.map((r, i) => [
            i + 1,
            r.hariTanggal || '-',
            r.waktu || '-',
            r.nama || '-',
            r.kelas || '-',
            r.jenis || '-',
            r.topik || '-',
            r.keterangan || '-',
          ]),
        },
      ],
    }),
    [rows, settings],
  );

  const handleAddRow = () => {
    addJurnalRow({
      hariTanggal: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      waktu: '09:00',
      nama: '',
      kelas: '8A',
      jenis: 'Konseling Individual',
      topik: '',
      keterangan: 'Proses',
    });
    onToast('Baris jurnal baru ditambahkan.');
  };

  const handleDeleteRow = (id: string) => {
    deleteJurnalRow(id);
    onToast('Baris jurnal dihapus.');
  };

  const handleCellChange = (id: string, field: keyof JurnalRow, value: string) => {
    updateJurnalRow(id, { [field]: value });
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Hari / Tanggal',
      'Waktu',
      'Nama Sasaran / Pihak Terlibat',
      'Kelas',
      'Bentuk / Jenis Layanan',
      'Uraian Topik & Kegiatan Bimbingan',
      'Hasil / Keterangan Tindak Lanjut',
    ];
    const exportRows = rows.map((r, idx) => [
      idx + 1,
      r.hariTanggal,
      r.waktu,
      r.nama,
      r.kelas,
      r.jenis,
      r.topik,
      r.keterangan,
    ]);
    exportToCsv(
      `Jurnal_Harian_BK_${settings.namaSekolah.replace(/\s+/g, '_')}_${new Date()
        .toISOString()
        .slice(0, 10)}`,
      headers,
      exportRows,
    );
    onToast(`Jurnal harian berhasil diekspor (${rows.length} catatan).`);
  };

  return (
    <div className="fade-up space-y-4">
      <DetailBar
        onBack={onBack}
        label="Dokumen"
        right={
          <div className="flex items-center gap-1.5">
            <PreviewButton onClick={() => setPreviewOpen(true)} />
            <button type="button" onClick={handleAddRow} className={smallBtnCls}>
              <Plus size={14} /> Tambah
            </button>
          </div>
        }
      />

      <PageHeader title="Jurnal Harian BK" subtitle={`${rows.length} kegiatan tercatat`} />

      {/* Tabel jurnal — kolom & gaya sama persis dengan JurnalForm versi PC */}
      <div className="border border-black bg-white p-3.5 text-black shadow-sm">
        <div className="mb-3 border-b-2 border-black pb-2.5 text-center">
          <h2 className="text-[13px] font-extrabold uppercase leading-snug tracking-wide text-black">
            JURNAL HARIAN KEGIATAN BIMBINGAN & KONSELING
          </h2>
          <p className="mt-0.5 text-[10px] font-bold leading-snug text-black/80">
            {settings.namaSekolah || 'SIM BK PRO'}, TAHUN AJARAN{' '}
            {settings.tahunAjaran || '2026/2027'}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="border border-black px-4 py-10 text-center">
            <p className="text-[13px] font-bold text-text">Belum ada kegiatan</p>
            <p className="mt-1 text-[11px] text-muted">
              Ketuk Tambah untuk mencatat jurnal harian.
            </p>
          </div>
        ) : (
          <>
          <TableHint className="!text-black/55" />
          <div className="-mx-3.5 overflow-x-auto border-t border-black">
            <table className="w-full min-w-[960px] border-collapse border border-black text-[12px]">
              <thead>
                <tr className="bg-gray-100 font-extrabold uppercase text-black">
                  <th className="w-10 border border-black px-2 py-2 text-center">NO</th>
                  <th className="w-40 border border-black px-3 py-2 text-left">HARI & TANGGAL</th>
                  <th className="w-20 border border-black px-2 py-2 text-center">WAKTU</th>
                  <th className="w-44 border border-black px-3 py-2 text-left">
                    NAMA SISWA / SASARAN
                  </th>
                  <th className="w-16 border border-black px-2 py-2 text-center">KELAS</th>
                  <th className="w-40 border border-black px-3 py-2 text-left">JENIS LAYANAN</th>
                  <th className="min-w-[240px] border border-black px-3 py-2 text-left">
                    URAIAN KEGIATAN & MASALAH
                  </th>
                  <th className="w-40 border border-black px-3 py-2 text-left">TINDAK LANJUT</th>
                  <th className="w-14 border border-black px-2 py-2 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="transition-colors hover:bg-neutral-50/30">
                    <td className="border border-black px-2 py-2 text-center align-top font-bold">
                      {i + 1}
                    </td>
                    <td className="border border-black px-2 py-1.5 align-top">
                      <input
                        type="text"
                        value={r.hariTanggal}
                        onChange={(e) => handleCellChange(r.id, 'hariTanggal', e.target.value)}
                        className="w-full rounded border-none bg-transparent px-1 py-0.5 text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="border border-black px-1.5 py-1.5 text-center align-top">
                      <input
                        type="text"
                        value={r.waktu}
                        onChange={(e) => handleCellChange(r.id, 'waktu', e.target.value)}
                        className="w-full rounded border-none bg-transparent px-1 py-0.5 text-center text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="border border-black px-2 py-1.5 align-top">
                      <input
                        type="text"
                        value={r.nama}
                        onChange={(e) => handleCellChange(r.id, 'nama', e.target.value)}
                        placeholder="Nama siswa..."
                        className="w-full rounded border-none bg-transparent px-1 py-0.5 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="border border-black px-1 py-1.5 text-center align-top">
                      <input
                        type="text"
                        value={r.kelas}
                        onChange={(e) => handleCellChange(r.id, 'kelas', e.target.value)}
                        className="w-12 rounded border-none bg-transparent px-1 py-0.5 text-center text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="border border-black px-2 py-1.5 align-top">
                      <select
                        value={r.jenis}
                        onChange={(e) => handleCellChange(r.id, 'jenis', e.target.value)}
                        className="w-full border-none bg-transparent py-0.5 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        {JENIS.map((j) => (
                          <option key={j} value={j}>
                            {j}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-black px-2 py-1.5 align-top">
                      <textarea
                        rows={2}
                        value={r.topik}
                        onChange={(e) => handleCellChange(r.id, 'topik', e.target.value)}
                        placeholder="Uraian kegiatan atau masalah..."
                        className="w-full resize-y rounded border-none bg-transparent p-1 text-xs leading-relaxed text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="border border-black px-2 py-1.5 align-top">
                      <input
                        type="text"
                        value={r.keterangan}
                        onChange={(e) => handleCellChange(r.id, 'keterangan', e.target.value)}
                        placeholder="Tindak lanjut..."
                        className="w-full rounded border-none bg-transparent px-1 py-0.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="border border-black px-1 py-1.5 text-center align-top">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(r.id)}
                        className="p-1 text-muted transition-colors hover:text-alert"
                        title="Hapus baris"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-black/30 pt-2.5 text-[10px] text-muted">
          <p>Total: {rows.length} Kegiatan Tercatat</p>
          <p className="font-semibold text-text">{settings.namaSekolah || 'SIM BK PRO'}</p>
        </div>
      </div>

      <button type="button" onClick={handleExportCsv} className="bk-btn ghost min-h-[48px] w-full">
        <Download size={15} /> Unduh Jurnal (Excel/CSV)
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
