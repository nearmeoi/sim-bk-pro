import React, { useState } from 'react';
import { ArrowLeft, Download, Printer, Save, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import KopSurat from '../../ui/KopSurat';
import HvsPreviewModal from '../../ui/HvsPreviewModal';
import { useBK } from '../../../context/BKContext';
import { exportToCsv } from '../../../lib/exportCsv';

interface LapbulFormProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const BULAN_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const LapbulForm: React.FC<LapbulFormProps> = ({ onBack, onToast }) => {
  const { records, settings } = useBK();
  const [previewHvsOpen, setPreviewHvsOpen] = useState(false);
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth());
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());

  // Filter records untuk bulan yang dipilih
  const filteredRecords = records.filter((r) => {
    const date = new Date(r.tanggal);
    return date.getMonth() === selectedBulan && date.getFullYear() === selectedTahun;
  });

  // Hitung statistik
  const stats = {
    klasikal: filteredRecords.filter(r => r.jenis === 'Bimbingan Klasikal').length,
    kelompok: filteredRecords.filter(r => r.jenis === 'Konseling Kelompok').length,
    individual: filteredRecords.filter(r => r.jenis === 'Konseling Individual').length,
    kunjungan: filteredRecords.filter(r => r.jenis === 'Kunjungan Rumah').length,
    konferensi: filteredRecords.filter(r => r.jenis === 'Konferensi Kasus').length,
    total: filteredRecords.length,
    siswaAktif: filteredRecords.filter(r => r.status === 'Proses').length,
    siswaSelesai: filteredRecords.filter(r => r.status === 'Selesai').length,
  };

  // Group by bidang
  const bidangStats = {
    pribadi: filteredRecords.filter(r => r.bidang === 'Pribadi').length,
    sosial: filteredRecords.filter(r => r.bidang === 'Sosial').length,
    belajar: filteredRecords.filter(r => r.bidang === 'Belajar').length,
    karir: filteredRecords.filter(r => r.bidang === 'Karir').length,
  };

  const handlePrevMonth = () => {
    if (selectedBulan === 0) {
      setSelectedBulan(11);
      setSelectedTahun(selectedTahun - 1);
    } else {
      setSelectedBulan(selectedBulan - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedBulan === 11) {
      setSelectedBulan(0);
      setSelectedTahun(selectedTahun + 1);
    } else {
      setSelectedBulan(selectedBulan + 1);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Jenis Layanan',
      'Bulan',
      'Tahun',
      'Jumlah',
      'Keterangan',
    ];
    const exportRows = [
      ['Bimbingan Klasikal', BULAN_OPTIONS[selectedBulan], String(selectedTahun), String(stats.klasikal), 'Sesi'],
      ['Konseling Kelompok', BULAN_OPTIONS[selectedBulan], String(selectedTahun), String(stats.kelompok), 'Sesi'],
      ['Konseling Individual', BULAN_OPTIONS[selectedBulan], String(selectedTahun), String(stats.individual), 'Sesi'],
      ['Kunjungan Rumah', BULAN_OPTIONS[selectedBulan], String(selectedTahun), String(stats.kunjungan), 'Kunjungan'],
      ['Konferensi Kasus', BULAN_OPTIONS[selectedBulan], String(selectedTahun), String(stats.konferensi), 'Sesi'],
      ['TOTAL LAYANAN', BULAN_OPTIONS[selectedBulan], String(selectedTahun), String(stats.total), 'Kegiatan'],
      ['', '', '', '', ''],
      ['Bidang Pribadi', BULAN_OPTIONS[selectedBulan], String(selectedTahun), String(bidangStats.pribadi), 'Kasus'],
      ['Bidang Sosial', BULAN_OPTIONS[selectedBulan], String(selectedTahun), String(bidangStats.sosial), 'Kasus'],
      ['Bidang Belajar', BULAN_OPTIONS[selectedBulan], String(selectedTahun), String(bidangStats.belajar), 'Kasus'],
      ['Bidang Karir', BULAN_OPTIONS[selectedBulan], String(selectedTahun), String(bidangStats.karir), 'Kasus'],
    ];
    exportToCsv(
      `Laporan_Bulanan_BK_${BULAN_OPTIONS[selectedBulan]}_${selectedTahun}_${settings.namaSekolah.replace(/\s+/g, '_')}`,
      headers,
      exportRows
    );
    onToast(`Laporan bulan ${BULAN_OPTIONS[selectedBulan]} ${selectedTahun} berhasil diekspor.`);
  };

  return (
    <div className="fade-up space-y-6">
      <style>{`@media print { @page { size: A4 portrait; margin: 0 !important; } html, body { padding: 12mm 18mm 14mm 16mm !important; } }`}</style>
      <div className="print:hidden flex items-center justify-between">
        <button onClick={onBack} className="bk-chip !min-h-[44px] text-xs font-bold">
          <ArrowLeft size={16} /> Kembali ke Dokumen
        </button>
          <span className="text-xs bg-neutral-50 text-neutral-800 font-bold px-3.5 py-1.5 rounded-full">
          Laporan Bulanan
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[24px] font-extrabold text-text tracking-tight">
            Laporan Bulanan BK
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Rekapitulasi statistik layanan per bulan siap tanda tangan Kepsek
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setPreviewHvsOpen(true)}
            className="min-h-[40px] px-4 rounded-[12px] bg-gray-100 text-text text-xs font-bold hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Eye size={15} />
            <span>Pratinjau</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[40px] px-4 rounded-[12px] bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={15} />
            <span>Unduh Excel</span>
          </button>
          <button
            type="button"
            onClick={() => onToast('Laporan bulanan disimpan.')}
            className="min-h-[40px] px-4 rounded-[12px] bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save size={15} />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="print:hidden flex items-center justify-center gap-4 bg-gray-50 p-3 rounded-[12px]">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-lg font-extrabold text-text">
            {BULAN_OPTIONS[selectedBulan]} {selectedTahun}
          </p>
          <p className="text-xs text-muted">
            {stats.total} kegiatan tercatat
          </p>
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Laporan Content */}
      <div className="bg-white border border-black rounded-none p-4 sm:p-5 shadow-sm text-black">
        <div className="hidden print:block mb-3">
          <KopSurat settings={settings} compact />
        </div>
        <div className="border-b-2 border-black pb-3 mb-3 text-center">
          <h2 className="text-[16px] sm:text-[17px] font-extrabold uppercase tracking-wide text-black">
            LAPORAN BULANAN BIMBINGAN DAN KONSELING
          </h2>
          <p className="text-xs text-black/80 font-bold mt-0.5">
            BULAN {BULAN_OPTIONS[selectedBulan].toUpperCase()} TAHUN {selectedTahun}
          </p>
          <p className="text-[11px] text-black/70 font-medium mt-0.5">
            {settings.namaSekolah || 'SMP NEGERI 1 BINTANG'}
          </p>
        </div>

        {/* Statistik Layanan */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-black uppercase border-b border-black pb-1">
            I. STATISTIK LAYANAN BIMBINGAN DAN KONSELING
          </h3>
          <table className="w-full text-[12px] sm:text-[13px] border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 font-extrabold text-black uppercase">
                <th className="border border-black px-3 py-2 text-left">JENIS LAYANAN</th>
                <th className="border border-black px-2 py-2 text-center w-20">JUMLAH</th>
                <th className="border border-black px-2 py-2 text-center w-24">SATUAN</th>
                <th className="border border-black px-3 py-2 text-left">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Bimbingan Klasikal</td>
                <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">{stats.klasikal}</td>
                <td className="border border-black px-2 py-2 text-center">Sesi</td>
                <td className="border border-black px-3 py-2">Layanan kelompok di kelas</td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Konseling Kelompok</td>
                <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">{stats.kelompok}</td>
                <td className="border border-black px-2 py-2 text-center">Sesi</td>
                <td className="border border-black px-3 py-2">Kelompok kecil (3-8 siswa)</td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Konseling Individual</td>
                <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">{stats.individual}</td>
                <td className="border border-black px-2 py-2 text-center">Sesi</td>
                <td className="border border-black px-3 py-2">Bimbingan satu-satu</td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Kunjungan Rumah</td>
                <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">{stats.kunjungan}</td>
                <td className="border border-black px-2 py-2 text-center">Kunjungan</td>
                <td className="border border-black px-3 py-2">Home visit</td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Konferensi Kasus</td>
                <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">{stats.konferensi}</td>
                <td className="border border-black px-2 py-2 text-center">Sesi</td>
                <td className="border border-black px-3 py-2">Pertemuan lintas pihak</td>
              </tr>
              <tr className="bg-neutral-50 font-extrabold">
                <td className="border border-black px-3 py-2 text-black uppercase">Total Layanan</td>
                <td className="border border-black px-2 py-2 text-center text-black font-black text-base">{stats.total}</td>
                <td className="border border-black px-2 py-2 text-center font-bold">Kegiatan</td>
                <td className="border border-black px-3 py-2 font-bold text-neutral-800">Keseluruhan layanan bulan ini</td>
              </tr>
            </tbody>
          </table>

          {/* Bidang Bimbingan */}
          <h3 className="text-sm font-extrabold text-black uppercase border-b border-black pb-1 pt-4">
            II. DISTRIBUSI BIDANG BIMBINGAN
          </h3>
          <table className="w-full text-[12px] sm:text-[13px] border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 font-extrabold text-black uppercase">
                <th className="border border-black px-3 py-2 text-left">BIDANG BIMBINGAN</th>
                <th className="border border-black px-2 py-2 text-center w-20">JUMLAH KASUS</th>
                <th className="border border-black px-2 py-2 text-center w-24">PERSENTASE</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Bidang Pribadi</td>
                <td className="border border-black px-2 py-2 text-center font-bold">{bidangStats.pribadi}</td>
                <td className="border border-black px-2 py-2 text-center">
                  {stats.total > 0 ? Math.round((bidangStats.pribadi / stats.total) * 100) : 0}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Bidang Sosial</td>
                <td className="border border-black px-2 py-2 text-center font-bold">{bidangStats.sosial}</td>
                <td className="border border-black px-2 py-2 text-center">
                  {stats.total > 0 ? Math.round((bidangStats.sosial / stats.total) * 100) : 0}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Bidang Belajar</td>
                <td className="border border-black px-2 py-2 text-center font-bold">{bidangStats.belajar}</td>
                <td className="border border-black px-2 py-2 text-center">
                  {stats.total > 0 ? Math.round((bidangStats.belajar / stats.total) * 100) : 0}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Bidang Karir</td>
                <td className="border border-black px-2 py-2 text-center font-bold">{bidangStats.karir}</td>
                <td className="border border-black px-2 py-2 text-center">
                  {stats.total > 0 ? Math.round((bidangStats.karir / stats.total) * 100) : 0}%
                </td>
              </tr>
            </tbody>
          </table>

          {/* Status Penanganan */}
          <h3 className="text-sm font-extrabold text-black uppercase border-b border-black pb-1 pt-4">
            III. STATUS PENANGANAN KASUS
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="border border-black p-3 text-center">
              <p className="text-xs font-bold text-gray-700 uppercase">Dalam Proses</p>
              <p className="text-2xl font-black text-primary">{stats.siswaAktif}</p>
              <p className="text-[10px] text-muted">Kasus</p>
            </div>
            <div className="border border-black p-3 text-center">
              <p className="text-xs font-bold text-gray-700 uppercase">Selesai Ditangani</p>
              <p className="text-2xl font-black text-primary">{stats.siswaSelesai}</p>
              <p className="text-[10px] text-muted">Kasus</p>
            </div>
            <div className="border border-black p-3 text-center">
              <p className="text-xs font-bold text-gray-700 uppercase">Total Kasus</p>
              <p className="text-2xl font-black text-neutral-800">{stats.siswaAktif + stats.siswaSelesai}</p>
              <p className="text-[10px] text-muted">Kasus</p>
            </div>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="hidden print:grid grid-cols-2 text-center text-xs pt-8 mt-6 border-t-2 border-black">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="mt-16">
              <p className="font-bold underline">{settings.kepalaSekolah || 'Drs. H. Mulyadi Kusuma, M.Pd.'}</p>
              <p>NIP. {settings.nipKepala || '19750101 200003 1 001'}</p>
            </div>
          </div>
          <div>
            <p>{settings.kotaSurat || 'Makassar'}, {new Date().getDate()} {BULAN_OPTIONS[new Date().getMonth()]} {new Date().getFullYear()}</p>
            <p className="font-bold">Guru Bimbingan & Konseling</p>
            <div className="mt-16">
              <p className="font-bold underline">{settings.guruBK || 'Siti Rahmawati, S.Pd., M.Kons., Gr.'}</p>
              <p>NIP. {settings.nipGuruBK || '19880512 201402 2 003'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* HVS Preview Modal */}
      <HvsPreviewModal
        open={previewHvsOpen}
        onClose={() => setPreviewHvsOpen(false)}
        title={`Pratinjau Kertas HVS: Laporan Bulanan BK`}
      >
        <KopSurat
          settings={settings}
          judul="LAPORAN BULANAN BIMBINGAN DAN KONSELING"
          subjudul={`BULAN ${BULAN_OPTIONS[selectedBulan].toUpperCase()} TAHUN ${selectedTahun}`}
        />

        {/* Statistik Layanan */}
        <h3 className="text-xs font-extrabold text-black uppercase border-b border-black pb-1 mb-2">
          I. STATISTIK LAYANAN BIMBINGAN DAN KONSELING
        </h3>
        <table className="w-full text-[10px] border-collapse border border-black mb-4">
          <thead>
            <tr className="bg-gray-100 font-extrabold text-black uppercase">
              <th className="border border-black p-1 text-left">JENIS LAYANAN</th>
              <th className="border border-black p-1 text-center w-16">JUMLAH</th>
              <th className="border border-black p-1 text-center w-16">SATUAN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold">Bimbingan Klasikal</td>
              <td className="border border-black p-1 text-center font-bold">{stats.klasikal}</td>
              <td className="border border-black p-1 text-center">Sesi</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">Konseling Kelompok</td>
              <td className="border border-black p-1 text-center font-bold">{stats.kelompok}</td>
              <td className="border border-black p-1 text-center">Sesi</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">Konseling Individual</td>
              <td className="border border-black p-1 text-center font-bold">{stats.individual}</td>
              <td className="border border-black p-1 text-center">Sesi</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">Kunjungan Rumah</td>
              <td className="border border-black p-1 text-center font-bold">{stats.kunjungan}</td>
              <td className="border border-black p-1 text-center">Kunjungan</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">Konferensi Kasus</td>
              <td className="border border-black p-1 text-center font-bold">{stats.konferensi}</td>
              <td className="border border-black p-1 text-center">Sesi</td>
            </tr>
            <tr className="bg-neutral-50 font-extrabold">
              <td className="border border-black p-1">Total Layanan</td>
              <td className="border border-black p-1 text-center">{stats.total}</td>
              <td className="border border-black p-1 text-center">Kegiatan</td>
            </tr>
          </tbody>
        </table>

        {/* Bidang Bimbingan */}
        <h3 className="text-xs font-extrabold text-black uppercase border-b border-black pb-1 mb-2 mt-3">
          II. DISTRIBUSI BIDANG BIMBINGAN
        </h3>
        <table className="w-full text-[10px] border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-gray-100 font-extrabold text-black uppercase">
              <th className="border border-black p-1 text-left">BIDANG BIMBINGAN</th>
              <th className="border border-black p-1 text-center w-16">JUMLAH</th>
              <th className="border border-black p-1 text-center w-16">PERSENTASE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold">Bidang Pribadi</td>
              <td className="border border-black p-1 text-center font-bold">{bidangStats.pribadi}</td>
              <td className="border border-black p-1 text-center">{stats.total > 0 ? Math.round((bidangStats.pribadi / stats.total) * 100) : 0}%</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">Bidang Sosial</td>
              <td className="border border-black p-1 text-center font-bold">{bidangStats.sosial}</td>
              <td className="border border-black p-1 text-center">{stats.total > 0 ? Math.round((bidangStats.sosial / stats.total) * 100) : 0}%</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">Bidang Belajar</td>
              <td className="border border-black p-1 text-center font-bold">{bidangStats.belajar}</td>
              <td className="border border-black p-1 text-center">{stats.total > 0 ? Math.round((bidangStats.belajar / stats.total) * 100) : 0}%</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">Bidang Karir</td>
              <td className="border border-black p-1 text-center font-bold">{bidangStats.karir}</td>
              <td className="border border-black p-1 text-center">{stats.total > 0 ? Math.round((bidangStats.karir / stats.total) * 100) : 0}%</td>
            </tr>
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
            <p>{settings.kotaSurat || 'Makassar'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru BK / Konselor</p>
            <div className="mt-16">
              <p className="font-bold underline">{settings.guruBK || 'Siti Rahmawati, S.Pd., M.Kons., Gr.'}</p>
              <p>NIP. {settings.nipGuruBK || '19880512 201402 2 003'}</p>
            </div>
          </div>
        </div>
      </HvsPreviewModal>
    </div>
  );
};