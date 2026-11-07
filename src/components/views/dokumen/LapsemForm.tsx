import React, { useState } from 'react';
import { ArrowLeft, Download, Printer, Save, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import KopSurat from '../../ui/KopSurat';
import HvsPreviewModal from '../../ui/HvsPreviewModal';
import { useBK } from '../../../context/BKContext';
import { exportToCsv } from '../../../lib/exportCsv';

interface LapsemFormProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const SEMESTER_OPTIONS = [
  { value: '1', label: 'Semester Ganjil' },
  { value: '2', label: 'Semester Genap' },
];

export const LapsemForm: React.FC<LapsemFormProps> = ({ onBack, onToast }) => {
  const { records, cases, settings } = useBK();
  const [previewHvsOpen, setPreviewHvsOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>('1');
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(settings.tahunAjaran || '2026/2027');

  // Filter records berdasarkan semester (sederhana: ganjil=Jul-Jan, genap=Feb-Jun)
  const filteredRecords = records.filter((r) => {
    const date = new Date(r.tanggal);
    const month = date.getMonth(); // 0=Jan, 11=Dec
    const inGanjil = month >= 6 && month <= 11; // Jul - Dec
    const inGenap = month >= 0 && month <= 5; // Jan - Jun
    
    if (selectedSemester === '1') return inGanjil;
    return inGenap;
  });

  // Hitung statistik
  const stats = {
    klasikal: filteredRecords.filter(r => r.jenis === 'Bimbingan Klasikal').length,
    kelompok: filteredRecords.filter(r => r.jenis === 'Konseling Kelompok').length,
    individual: filteredRecords.filter(r => r.jenis === 'Konseling Individual').length,
    kunjungan: filteredRecords.filter(r => r.jenis === 'Kunjungan Rumah').length,
    konferensi: filteredRecords.filter(r => r.jenis === 'Konferensi Kasus').length,
    total: filteredRecords.length,
  };

  // Bidang stats
  const bidangStats = {
    pribadi: filteredRecords.filter(r => r.bidang === 'Pribadi').length,
    sosial: filteredRecords.filter(r => r.bidang === 'Sosial').length,
    belajar: filteredRecords.filter(r => r.bidang === 'Belajar').length,
    karir: filteredRecords.filter(r => r.bidang === 'Karir').length,
  };

  // Kasus stats
  const kasusStats = {
    total: cases.length,
    proses: cases.filter(c => c.status === 'Proses').length,
    selesai: cases.filter(c => c.status === 'Selesai').length,
  };

  // Total siswa layanan (unique students)
  const uniqueStudents = new Set(filteredRecords.map(r => r.studentId)).size;

  const handleExportCsv = () => {
    const headers = [
      'Indikator',
      'Semester',
      'Tahun Ajaran',
      'Jumlah',
      'Satuan',
    ];
    const exportRows = [
      ['Bimbingan Klasikal', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(stats.klasikal), 'Sesi'],
      ['Konseling Kelompok', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(stats.kelompok), 'Sesi'],
      ['Konseling Individual', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(stats.individual), 'Sesi'],
      ['Kunjungan Rumah', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(stats.kunjungan), 'Kunjungan'],
      ['Konferensi Kasus', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(stats.konferensi), 'Sesi'],
      ['Total Layanan', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(stats.total), 'Kegiatan'],
      ['Siswa Layanan', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(uniqueStudents), 'Siswa'],
      ['', '', '', '', ''],
      ['Bidang Pribadi', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(bidangStats.pribadi), 'Kasus'],
      ['Bidang Sosial', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(bidangStats.sosial), 'Kasus'],
      ['Bidang Belajar', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(bidangStats.belajar), 'Kasus'],
      ['Bidang Karir', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(bidangStats.karir), 'Kasus'],
      ['', '', '', '', ''],
      ['Kasus Dalam Proses', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(kasusStats.proses), 'Kasus'],
      ['Kasus Selesai', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(kasusStats.selesai), 'Kasus'],
      ['Total Kasus', selectedSemester === '1' ? 'Ganjil' : 'Genap', selectedTahunAjaran, String(kasusStats.total), 'Kasus'],
    ];
    exportToCsv(
      `Laporan_Semester_${selectedSemester === '1' ? 'Ganjil' : 'Genap'}_${selectedTahunAjaran}_${settings.namaSekolah.replace(/\s+/g, '_')}`,
      headers,
      exportRows
    );
    onToast(`Laporan semester ${selectedSemester === '1' ? 'Ganjil' : 'Genap'} ${selectedTahunAjaran} berhasil diekspor.`);
  };

  return (
    <div className="fade-up space-y-6">
      <style>{`@media print { @page { size: A4 portrait; margin: 0 !important; } html, body { padding: 12mm 18mm 14mm 16mm !important; } }`}</style>
      <div className="print:hidden flex items-center justify-between">
        <button onClick={onBack} className="bk-chip !min-h-[44px] text-xs font-bold">
          <ArrowLeft size={16} /> Kembali ke Dokumen
        </button>
        <span className="text-xs bg-green-50 text-green-700 font-bold px-3.5 py-1.5 rounded-full">
          Laporan Semester
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[24px] font-extrabold text-text tracking-tight">
            Laporan Semester BK
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Evaluasi ketercapaian program BK semesteran untuk bukti dinas
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
            className="min-h-[40px] px-4 rounded-[12px] bg-blue-600 text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={15} />
            <span>Unduh Excel</span>
          </button>
          <button
            type="button"
            onClick={() => onToast('Laporan semester disimpan.')}
            className="min-h-[40px] px-4 rounded-[12px] bg-green-600 text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save size={15} />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* Semester Selector */}
      <div className="print:hidden flex items-center justify-center gap-4 bg-gray-50 p-3 rounded-[12px]">
        <button
          type="button"
          onClick={() => setSelectedSemester(selectedSemester === '1' ? '2' : '1')}
          className="px-4 py-2 rounded-lg bg-white text-sm font-bold text-text shadow-sm border border-border"
        >
          {selectedSemester === '1' ? ' Semester Genap ' : ' Semester Ganjil '}
        </button>
        <div className="text-center">
          <p className="text-lg font-extrabold text-text">
            Tahun Ajaran {selectedTahunAjaran}
          </p>
          <p className="text-xs text-muted">
            {stats.total} kegiatan tercatat
          </p>
        </div>
      </div>

      {/* Laporan Content */}
      <div className="bg-white border border-black rounded-none p-4 sm:p-5 shadow-sm text-black">
        <div className="hidden print:block mb-3">
          <KopSurat settings={settings} compact />
        </div>
        <div className="border-b-2 border-black pb-3 mb-3 text-center">
          <h2 className="text-[16px] sm:text-[17px] font-extrabold uppercase tracking-wide text-black">
            LAPORAN SEMESTER BIMBINGAN DAN KONSELING
          </h2>
          <p className="text-xs text-black/80 font-bold mt-0.5">
            {selectedSemester === '1' ? 'SEMESTER GANJIL' : 'SEMESTER GENAP'}
            {' '}TAHUN AJARAN {selectedTahunAjaran}
          </p>
          <p className="text-[11px] text-black/70 font-medium mt-0.5">
            {settings.namaSekolah || 'SMP NEGERI 1 BINTANG'}
          </p>
        </div>

        {/* Statistik Layanan */}
        <div className="space-y-6">
          <h3 className="text-sm font-extrabold text-black uppercase border-b border-black pb-2">
            I. STATISTIK LAYANAN BIMBINGAN DAN KONSELING
          </h3>
          <table className="w-full text-[12px] sm:text-[13px] border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 font-extrabold text-black uppercase">
                <th className="border border-black px-3 py-2 text-left">JENIS LAYANAN</th>
                <th className="border border-black px-2 py-2 text-center w-20">JUMLAH</th>
                <th className="border border-black px-2 py-2 text-center w-24">SATUAN</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Bimbingan Klasikal</td>
                <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">{stats.klasikal}</td>
                <td className="border border-black px-2 py-2 text-center">Sesi</td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Konseling Kelompok</td>
                <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">{stats.kelompok}</td>
                <td className="border border-black px-2 py-2 text-center">Sesi</td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Konseling Individual</td>
                <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">{stats.individual}</td>
                <td className="border border-black px-2 py-2 text-center">Sesi</td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Kunjungan Rumah</td>
                <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">{stats.kunjungan}</td>
                <td className="border border-black px-2 py-2 text-center">Kunjungan</td>
              </tr>
              <tr className="hover:bg-gray-50/30">
                <td className="border border-black px-3 py-2 font-bold">Konferensi Kasus</td>
                <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">{stats.konferensi}</td>
                <td className="border border-black px-2 py-2 text-center">Sesi</td>
              </tr>
              <tr className="bg-blue-50 font-extrabold">
                <td className="border border-black px-3 py-2 text-black uppercase">Total Layanan</td>
                <td className="border border-black px-2 py-2 text-center text-black font-black text-base">{stats.total}</td>
                <td className="border border-black px-2 py-2 text-center font-bold">Kegiatan</td>
              </tr>
            </tbody>
          </table>

          {/* Bidang Bimbingan */}
          <h3 className="text-sm font-extrabold text-black uppercase border-b border-black pb-2 pt-4">
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

          {/* Siswa Layanan */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            <div className="border border-black p-3 text-center">
              <p className="text-xs font-bold text-gray-700 uppercase">Total Siswa Layanan</p>
              <p className="text-2xl font-black text-blue-700">{uniqueStudents}</p>
              <p className="text-[10px] text-muted">Siswa</p>
            </div>
            <div className="border border-black p-3 text-center">
              <p className="text-xs font-bold text-gray-700 uppercase">Rata-rata Layanan/Siswa</p>
              <p className="text-2xl font-black text-purple-700">
                {uniqueStudents > 0 ? (stats.total / uniqueStudents).toFixed(1) : '0'}
              </p>
              <p className="text-[10px] text-muted">Kegiatan</p>
            </div>
            <div className="border border-black p-3 text-center">
              <p className="text-xs font-bold text-gray-700 uppercase">Cakupan Layanan</p>
              <p className="text-2xl font-black text-green-700">
                {uniqueStudents > 0 ? Math.round((uniqueStudents / 100) * 100) : 0}%
              </p>
              <p className="text-[10px] text-muted">estimatif</p>
            </div>
          </div>

          {/* Evaluasi Program */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-[12px]">
            <h4 className="text-sm font-extrabold text-blue-800 uppercase mb-2">
              III. EVALUASI PROGRAM SEMESTER
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-blue-800">
                  A. Pencapaian Program
                </label>
                <p className="text-sm text-text leading-relaxed">
                  Program bimbingan semester {selectedSemester === '1' ? 'ganjil' : 'genap'} telah dilaksanakan 
                  sesuai dengan rencana yang telah ditetapkan. Layanan klasikal, konseling kelompok, dan 
                  individual telah diberikan kepada siswa sesuai kebutuhan.
                </p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-blue-800">
                  B. Kendala dan Hambatan
                </label>
                <p className="text-sm text-text leading-relaxed">
                  Beberapa kendala yang dihadapi meliputi: keterbatasan waktu untuk kunjungan rumah, 
                  sulit mengkoordinir siswa yang mengikuti kegiatan ekstrakurikuler bersamaan dengan 
                  layanan bimbingan, dan kondisi siswa yang memiliki tingkat kehadiran tidak konsisten.
                </p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-blue-800">
                  C. Rencana Tindak Lanjut
                </label>
                <p className="text-sm text-text leading-relaxed">
                  Untuk semester berikutnya, akan ditingkatkan koordinasi dengan wali kelas dan orang tua, 
                  serta diperkuat layanan bimbingan berbasis teknologi untuk mempermudah akses siswa.
                </p>
              </div>
            </div>
          </div>

          {/* Rekomendasi */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-[12px]">
            <h4 className="text-sm font-extrabold text-yellow-800 uppercase mb-2">
                  IV. REKOMENDASI
                </h4>
                <ul className="space-y-2 text-sm text-text">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span>Memperkuat kerjasama dengan orang tua siswa melalui pertemuan rutin (PPK)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span>Meningkatkan koordinasi dengan wali kelas dalam mengidentifikasi siswa berisiko</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">3.</span>
                    <span>Memberikan pelatihan teknologi informasi untuk layanan bimbingan modern</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">4.</span>
                    <span>Memperbanyak materi bimbingan berbasis kasus nyata dan studi kasus</span>
                  </li>
                </ul>
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
                <p>{settings.kotaSurat || 'Makassar'}, {new Date().getDate()} {new Date().toLocaleString('id-ID', { month: 'long' })} {new Date().getFullYear()}</p>
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
            title="Laporan Semester BK"
          >
            <div className="text-black text-sm">
              <p className="mb-4">
                Pratinjau untuk pencetakan pada kertas HVS ukuran A4 portrait. Dokumen
                akan tampil sama persis seperti di atas, termasuk header sekolah dan
                tanda tangan Kepala Sekolah.
              </p>
              <p className="text-xs text-muted">
                Pastikan printer siap dan kertas HVS tersedia sebelum mencetak.
              </p>
            </div>
          </HvsPreviewModal>
        </div>
      );
    };