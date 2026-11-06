import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Download, Printer, Save, Eye } from 'lucide-react';
import KopSurat from '../../ui/KopSurat';
import HvsPreviewModal from '../../ui/HvsPreviewModal';
import { useBK } from '../../../context/BKContext';
import { exportToCsv } from '../../../lib/exportCsv';
import type { JurnalRow } from '../../../types';

interface JurnalFormProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

export const JurnalForm: React.FC<JurnalFormProps> = ({ onBack, onToast }) => {
  const { jurnalRows: rows, addJurnalRow, updateJurnalRow, deleteJurnalRow, settings } = useBK();
  const [previewHvsOpen, setPreviewHvsOpen] = useState(false);
  const handleAddRow = () => {
    addJurnalRow({
      hariTanggal: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }),
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
      `Jurnal_Harian_BK_${settings.namaSekolah.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      headers,
      exportRows
    );
    onToast(`Jurnal harian berhasil diekspor (${rows.length} catatan).`);
  };

  return (
    <div className="fade-up space-y-6">
      <style>{`@media print { @page { size: A4 landscape; margin: 0 !important; } html, body { padding: 8mm 16mm 10mm 14mm !important; } }`}</style>
      <div className="print:hidden flex items-center justify-between">
        <button onClick={onBack} className="bk-chip !min-h-[44px] text-xs font-bold">
          <ArrowLeft size={16} /> Kembali ke Dokumen
        </button>
        <span className="text-xs bg-primary-tint text-primary font-bold px-3.5 py-1.5 rounded-full">
          {rows.length} Kegiatan Tercatat
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-[750] text-text tracking-tight">
            Jurnal Harian BK
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {settings.namaSekolah}
          </p>
        </div>

        {/* Action Button Utama di Pojok Kanan Atas (Standar Seragam) */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setPreviewHvsOpen(true)}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Lihat pratinjau lembar kertas HVS putih sebelum dicetak"
          >
            <Eye size={15} />
            <span>Preview HVS</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewHvsOpen(true);
              setTimeout(() => window.print(), 150);
            }}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer size={15} />
            <span>Cetak</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Unduh jurnal harian ke file Excel"
          >
            <Download size={15} />
            <span>Unduh Excel</span>
          </button>
          <button
            type="button"
            onClick={() => onToast('Jurnal harian berhasil disimpan.')}
            className="min-h-[40px] px-4 rounded-[12px] bg-primary text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save size={15} />
            <span>Simpan</span>
          </button>
          <button
            type="button"
            onClick={handleAddRow}
            className="min-h-[40px] px-4 rounded-[12px] bg-accent text-white font-bold text-xs hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Tambah Entri</span>
          </button>
        </div>
      </div>

      {/* Jurnal Table - Desain Seragam Angket */}
      <div className="bg-white border border-black rounded-none p-4 sm:p-5 shadow-sm text-black">
        <div className="hidden print:block mb-3">
          <KopSurat settings={settings} compact />
        </div>
        <div className="border-b-2 border-black pb-3 mb-3 text-center">
          <h2 className="text-[16px] sm:text-[17px] font-extrabold uppercase tracking-wide text-black">
            JURNAL HARIAN KEGIATAN BIMBINGAN & KONSELING
          </h2>
          <p className="text-xs text-black/80 font-bold mt-0.5">
            {settings.namaSekolah || 'SMP NEGERI 1 BINTANG'}, TAHUN AJARAN {settings.tahunAjaran || '2026/2027'}
          </p>
        </div>

        <div className="overflow-x-auto border-t border-black">
          <table className="w-full text-[12px] sm:text-[13px] border-collapse border border-black min-w-[960px]">
            <thead>
              <tr className="bg-gray-100 font-extrabold text-black uppercase">
                <th className="border border-black px-2 py-2 text-center w-10">NO</th>
                <th className="border border-black px-3 py-2 text-left w-40">HARI & TANGGAL</th>
                <th className="border border-black px-2 py-2 text-center w-20">WAKTU</th>
                <th className="border border-black px-3 py-2 text-left w-44">NAMA SISWA / SASARAN</th>
                <th className="border border-black px-2 py-2 text-center w-16">KELAS</th>
                <th className="border border-black px-3 py-2 text-left w-40">JENIS LAYANAN</th>
                <th className="border border-black px-3 py-2 text-left min-w-[240px]">URAIAN KEGIATAN & MASALAH</th>
                <th className="border border-black px-3 py-2 text-left w-40">TINDAK LANJUT</th>
                <th className="print:hidden border border-black px-2 py-2 text-center w-14">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="border border-black px-2 py-2 text-center font-bold align-top">
                    {i + 1}
                  </td>
                  <td className="border border-black px-2 py-1.5 align-top">
                    <input
                       type="text"
                       value={r.hariTanggal}
                       onChange={(e) => handleCellChange(r.id, 'hariTanggal', e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 font-medium text-black text-xs"
                    />
                  </td>
                  <td className="border border-black px-1.5 py-1.5 text-center align-top">
                    <input
                      type="text"
                      value={r.waktu}
                      onChange={(e) => handleCellChange(r.id, 'waktu', e.target.value)}
                      className="w-full text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 font-bold text-black text-xs"
                    />
                  </td>
                  <td className="border border-black px-2 py-1.5 align-top">
                    <input
                      type="text"
                      value={r.nama}
                      onChange={(e) => handleCellChange(r.id, 'nama', e.target.value)}
                      placeholder="Nama siswa..."
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 font-bold text-black text-xs"
                    />
                  </td>
                  <td className="border border-black px-1 py-1.5 text-center align-top">
                    <input
                      type="text"
                      value={r.kelas}
                      onChange={(e) => handleCellChange(r.id, 'kelas', e.target.value)}
                      className="w-12 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 font-bold text-black text-xs"
                    />
                  </td>
                  <td className="border border-black px-2 py-1.5 align-top">
                    <select
                      value={r.jenis}
                      onChange={(e) => handleCellChange(r.id, 'jenis', e.target.value)}
                      className="w-full text-xs font-semibold py-0.5 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary text-black"
                    >
                      <option value="Konseling Individual">Konseling Individual</option>
                      <option value="Kunjungan Rumah">Kunjungan Rumah</option>
                      <option value="Konferensi Kasus">Konferensi Kasus</option>
                      <option value="Bimbingan Klasikal">Bimbingan Klasikal</option>
                      <option value="Bimbingan Kelompok">Bimbingan Kelompok</option>
                      <option value="Rapat/Koordinasi">Rapat/Koordinasi</option>
                    </select>
                  </td>
                  <td className="border border-black px-2 py-1.5 align-top">
                    <textarea
                      rows={2}
                      value={r.topik}
                      onChange={(e) => handleCellChange(r.id, 'topik', e.target.value)}
                      placeholder="Uraian kegiatan atau masalah..."
                      className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded text-xs leading-relaxed text-black resize-y"
                    />
                  </td>
                  <td className="border border-black px-2 py-1.5 align-top">
                    <input
                      type="text"
                      value={r.keterangan}
                      onChange={(e) => handleCellChange(r.id, 'keterangan', e.target.value)}
                      placeholder="Tindak lanjut..."
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 text-xs text-gray-800"
                    />
                  </td>
                  <td className="print:hidden border border-black px-1 py-1.5 text-center align-top">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(r.id)}
                      className="p-1 text-muted hover:text-alert transition-colors"
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

        <div className="mt-4 pt-3 border-t border-black/30 text-[11px] text-muted flex justify-between items-center">
          <p>Total: {rows.length} Kegiatan Tercatat</p>
          <p className="font-semibold text-text">{settings.namaSekolah || 'SMP Negeri 1 Bintang'}</p>
        </div>

        {/* Lembar Tanda Tangan Cetak Jurnal */}
        <div className="hidden print:grid grid-cols-2 text-center text-xs pt-6 print:break-inside-avoid">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="mt-14">
              <p className="font-bold underline text-[11px]">{settings.kepalaSekolah || 'Kepala Sekolah'}</p>
              <p className="text-[9.5px]">NIP. {settings.nipKepala || '-'}</p>
            </div>
          </div>
          <div>
            <p>{settings.kotaSurat || 'Kota Bintang'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru BK / Konselor</p>
            <div className="mt-14">
              <p className="font-bold underline text-[11px]">{settings.guruBK || 'Guru BK'}</p>
              <p className="text-[9.5px]">NIP. {settings.nipGuruBK || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SIMULASI KERTAS HVS A4 / FOLIO PUTIH */}
      <HvsPreviewModal
        open={previewHvsOpen}
        onClose={() => setPreviewHvsOpen(false)}
        title="Pratinjau Kertas HVS: Jurnal Harian BK"
      >
        <KopSurat
          settings={settings}
          judul="JURNAL HARIAN KEGIATAN BIMBINGAN & KONSELING"
          subjudul={`TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`}
        />

        <table className="w-full text-[10.5px] border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-gray-100 font-extrabold text-black">
              <th className="border border-black p-1 text-center w-8">NO</th>
              <th className="border border-black p-1 text-left w-24">HARI/TGL</th>
              <th className="border border-black p-1 text-left w-28">SASARAN</th>
              <th className="border border-black p-1 text-left w-28">LAYANAN</th>
              <th className="border border-black p-1 text-left">URAIAN KEGIATAN</th>
              <th className="border border-black p-1 text-left w-28">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="border border-black p-1 text-center font-bold">{i + 1}</td>
                <td className="border border-black p-1">{r.hariTanggal}</td>
                <td className="border border-black p-1 font-bold">{r.nama} ({r.kelas})</td>
                <td className="border border-black p-1">{r.jenis}</td>
                <td className="border border-black p-1">{r.topik}</td>
                <td className="border border-black p-1">{r.keterangan}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 text-center text-xs pt-4">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="mt-16">
              <p className="font-bold underline">{settings.kepalaSekolah || 'Drs. H. Mulyadi Kusuma, M.Pd.'}</p>
              <p>NIP. {settings.nipKepala || '19750101 200003 1 001'}</p>
            </div>
          </div>
          <div>
            <p>{settings.kotaSurat || 'Kota Bintang'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru BK / Konselor</p>
            <div className="mt-16">
              <p className="font-bold underline">{settings.guruBK || 'Siti Rahmawati, S.Pd., Gr.'}</p>
              <p>NIP. {settings.nipGuruBK || '19880512 201402 2 003'}</p>
            </div>
          </div>
        </div>
      </HvsPreviewModal>
    </div>
  );
};

export default JurnalForm;
