import React, { useState } from 'react';
import {
  Printer,
  Plus,
  Save,
  Trash2,
  Table,
  FileText,
  ClipboardPaste,
  Download,
  Eye,
} from "lucide-react";
import PetunjukIbu from '../ui/PetunjukIbu';
import HvsPreviewModal from '../ui/HvsPreviewModal';
import { useBK } from '../../context/BKContext';
import { newId } from '../../lib/id';
import { exportToCsv } from '../../lib/exportCsv';
import type { IndividualKarirAngket, NavView } from '../../types';
import KarirAngketForm from './karir/KarirAngketForm';

interface BimbinganKarirViewProps {
  onNav?: (v: NavView) => void;
  onToast: (msg: string) => void;
}

export { type IndividualKarirAngket };

export const BimbinganKarirView: React.FC<BimbinganKarirViewProps> = ({ onToast }) => {
  const {
    karirList: studentList,
    addKarirStudent,
    updateKarirStudent,
    deleteKarirStudent,
    setKarirList,
    settings,
  } = useBK();
  const [previewHvsOpen, setPreviewHvsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'angket' | 'batch'>('angket');
  const [kelasFilter, setKelasFilter] = useState('Semua Kelas 9');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    studentList[0]?.id || ''
  );

  // Quick Paste Box
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Filter siswa untuk batch input
  const displayedStudents = studentList.filter((s) => {
    if (kelasFilter === 'Semua Kelas 9') return true;
    return s.kelas === kelasFilter;
  });

  // Siswa aktif untuk mode lembar angket
  const current =
    studentList.find((s) => s.id === selectedStudentId) ||
    studentList[0] ||
    ({} as IndividualKarirAngket);

  const updateStudentField = <K extends keyof IndividualKarirAngket>(
    id: string,
    field: K,
    val: IndividualKarirAngket[K]
  ) => {
    updateKarirStudent(id, field, val);
  };

  const updateCurrent = <K extends keyof IndividualKarirAngket>(
    field: K,
    val: IndividualKarirAngket[K]
  ) => {
    if (current.id) {
      updateStudentField(current.id, field, val);
    }
  };

  const handleAddBatchRow = () => {
    const kid = newId('k');
    const newRow: IndividualKarirAngket = {
      id: kid,
      namaSiswa: 'Siswa Baru',
      kelas: kelasFilter !== 'Semua Kelas 9' ? kelasFilter : '9A',
      noAbsen: String(studentList.length + 1).padStart(2, '0'),
      nis: String(2400 + studentList.length + 1),
      nisn: `310123${Math.floor(1000 + Math.random() * 9000)}`,
      namaOrtu: 'Orang Tua / Wali',
      noHpOrtu: '0812-xxxx-xxxx',
      rencanaSetelahSMP: 'SMA',
      alasanRencana: 'Melanjutkan pendidikan menengah',
      pilihan1Sekolah: 'SMAN 1 / SMKN 1...',
      pilihan1Jurusan: 'Peminatan...',
      pilihan1Jalur: 'Zonasi',
      pilihan1Alasan: '',
      pilihan2Sekolah: 'Sekolah Cadangan...',
      pilihan2Jurusan: '',
      pilihan2Jalur: 'Zonasi',
      rencanaCadangan3: '',
      citaCita: 'Profesi Impian...',
      alasanCitaCita: '',
      rencanaSetelahLanjutan: 'Kuliah (Perguruan Tinggi)',
      statusDiskusiOrtu: 'Setuju Penuh',
      aspirasiPilihanOrtu: '',
      kendalaKeluarga: '',
      rataRapor: '82.0',
      rekomendasiBK: 'Catatan rekomendasi konselor...',
      tindakLanjutBK: 'Rekomendasi Aman',
    };

    addKarirStudent(newRow);
    setSelectedStudentId(kid);
    onToast('Siswa baru berhasil ditambahkan.');
  };

  const handleDeleteStudent = (id: string, nama: string) => {
    if (studentList.length <= 1) {
      onToast('Minimal harus ada 1 data siswa');
      return;
    }
    deleteKarirStudent(id);
    onToast(`Data "${nama}" berhasil dihapus.`);
  };

  const handleProcessPaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split('\n');
    let addedCount = 0;

    const parsed: IndividualKarirAngket[] = lines.map((line, idx) => {
      const cols = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
      const nama = cols[0]?.trim() || `Siswa ${studentList.length + idx + 1}`;
      const sekolah1 = cols[1]?.trim() || '-';
      const jurusan1 = cols[2]?.trim() || 'MIPA';
      const cita = cols[3]?.trim() || 'Melanjutkan Studi';

      addedCount++;
      return {
        id: newId('kp'),
        namaSiswa: nama,
        kelas: kelasFilter !== 'Semua Kelas 9' ? kelasFilter : '9A',
        noAbsen: String(studentList.length + idx + 1).padStart(2, '0'),
        nis: String(2420 + idx),
        nisn: `31012345${idx + 20}`,
        namaOrtu: 'Orang Tua Murid',
        noHpOrtu: '0812-xxxx-xxxx',
        rencanaSetelahSMP: sekolah1.toUpperCase().includes('SMK') ? 'SMK' : 'SMA',
        alasanRencana: 'Hasil pendataan cepat wali kelas',
        pilihan1Sekolah: sekolah1,
        pilihan1Jurusan: jurusan1,
        pilihan1Jalur: 'Zonasi',
        pilihan1Alasan: '',
        pilihan2Sekolah: 'Sekolah Cadangan',
        pilihan2Jurusan: '',
        pilihan2Jalur: 'Zonasi',
        rencanaCadangan3: '',
        citaCita: cita,
        alasanCitaCita: '',
        rencanaSetelahLanjutan: 'Kuliah (Perguruan Tinggi)',
        statusDiskusiOrtu: 'Setuju Penuh',
        aspirasiPilihanOrtu: '',
        kendalaKeluarga: '',
        rataRapor: '84.0',
        rekomendasiBK: 'Pilihan sesuai data masal',
        tindakLanjutBK: 'Rekomendasi Aman',
      };
    });

    parsed.forEach((item) => addKarirStudent(item));
    setPasteText('');
    setShowPasteBox(false);
    onToast(`${addedCount} data pilihan siswa berhasil diimpor.`);
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Nama Siswa',
      'Kelas',
      'No Absen',
      'NIS',
      'NISN',
      'Rencana Lanjutan',
      'Pilihan 1 Sekolah',
      'Pilihan 1 Jurusan',
      'Pilihan 1 Jalur',
      'Pilihan 2 Sekolah (Cadangan)',
      'Pilihan 2 Jurusan',
      'Cita-Cita Profesi',
      'Rencana Pasca Lanjutan',
      'Persetujuan Orang Tua',
      'Rekomendasi BK',
    ];
    const rows = studentList.map((s, idx) => [
      idx + 1,
      s.namaSiswa,
      s.kelas,
      s.noAbsen,
      s.nis,
      s.nisn,
      s.rencanaSetelahSMP,
      s.pilihan1Sekolah,
      s.pilihan1Jurusan,
      s.pilihan1Jalur,
      s.pilihan2Sekolah,
      s.pilihan2Jurusan,
      s.citaCita,
      s.rencanaSetelahLanjutan,
      s.statusDiskusiOrtu,
      s.rekomendasiBK,
    ]);
    exportToCsv(
      `Pemetaan_Karir_${settings.namaSekolah.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows
    );
    onToast(`âœ“ Berhasil mengekspor ${studentList.length} data pemetaan karir ke CSV!`);
  };

  const handlePrint = () => {
    setPreviewHvsOpen(true);
    setTimeout(() => window.print(), 150);
  };

  const handleSave = () => {
    onToast('Data bimbingan karir berhasil disimpan.');
  };

  return (
    <div className="fade-up space-y-5 max-w-5xl mx-auto">
      {/* BARIS 1: HEADER HALAMAN & PRIMARY ACTIONS */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-[750] text-text tracking-tight">
            Bimbingan Karir Siswa
          </h1>
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
            onClick={handlePrint}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer size={15} />
            <span>Cetak</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Unduh data karir siswa ke file Excel"
          >
            <Download size={15} />
            <span>Unduh Excel</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[40px] px-4 rounded-[12px] bg-blue-600 text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save size={15} />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      <PetunjukIbu
        tips={[
          'Tab 1: Cetak lembar pilihan SMA/SMK untuk diisi siswa dan orang tua di rumah.',
          'Tab 2: Lihat tabel rekapitulasi pilihan seluruh siswa se-kelas dalam satu layar.',
          'Gunakan tombol "Unduh Excel" jika Kepala Sekolah meminta laporan rekap PPDB kelas 9.'
        ]}
      />
      {/* BARIS 2: TAB NAVIGASI TAMPILAN */}
      <div className="print:hidden border-b border-border">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('angket')}
            className={`px-5 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              viewMode === 'angket'
                ? 'border-primary text-primary bg-primary-tint/30 rounded-t-[10px]'
                : 'border-transparent text-muted hover:text-text hover:bg-bg rounded-t-[10px]'
            }`}
          >
            <FileText size={16} />
            <span>1. Lembar Siswa</span>
          </button>

          <button
            onClick={() => setViewMode('batch')}
            className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              viewMode === 'batch'
                ? 'border-primary text-primary bg-primary-tint/30 rounded-t-[10px]'
                : 'border-transparent text-muted hover:text-text hover:bg-bg rounded-t-[10px]'
            }`}
          >
            <Table size={16} />
            <span>2. Rekap Kelas</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              {displayedStudents.length} Siswa
            </span>
          </button>
        </div>
      </div>

      {/* FILTER & QUICK ACTIONS BAR */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-surface p-3.5 rounded-[16px] border border-border shadow-sm">
        {viewMode === 'batch' ? (
          <>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-text">Pilih Rombel :</span>
              <div className="flex gap-1.5">
                {['Semua Kelas 9', '9A', '9B', '9C'].map((k) => (
                  <button
                    key={k}
                    onClick={() => setKelasFilter(k)}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${
                      kelasFilter === k
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-bg text-muted hover:text-text hover:bg-gray-200'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPasteBox(!showPasteBox)}
                className="px-3.5 py-2 rounded-[12px] bg-bg hover:bg-gray-200 text-text text-xs font-bold transition-colors flex items-center gap-1.5 border border-border"
              >
                <ClipboardPaste size={15} /> Paste dari Excel
              </button>
              <button
                onClick={handleAddBatchRow}
                className="px-4 py-2 rounded-[12px] bg-green-600 text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={15} /> Tambah Baris
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-text">Pilih Lembar Siswa :</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="min-h-[40px] px-3 rounded-[10px] border border-border text-xs font-bold text-text bg-surface focus:outline-none focus:border-primary shadow-sm"
              >
                {studentList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaSiswa} ({s.kelas}) - Pilihan: {s.pilihan1Sekolah}
                  </option>
                ))}
              </select>
            </div>

            {/* <p className="text-xs text-muted hidden sm:block">
              Perubahan pada lembar angket otomatis tersimpan di tabel rekapitulasi.
            </p> */}
          </div>
        )}
      </div>

      {/* QUICK PASTE BOX */}
      {showPasteBox && viewMode === 'batch' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-[16px] space-y-3 fade-up">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
              <ClipboardPaste size={16} /> Paste Kolom dari Microsoft Excel / Google Sheets
            </h4>
            <span className="text-[11px] text-muted">Format: Nama [Tab] Sekolah1 [Tab] Jurusan1 [Tab] Cita-cita</span>
          </div>
          <textarea
            rows={3}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Contoh:&#10;Ahmad Dahlan	SMAN 1 Bintang	MIPA	Dokter&#10;Nurul Hidayah	SMKN 2 Bintang	DKV	Desainer Grafis"
            className="w-full p-2.5 bg-white border border-border rounded-[10px] text-xs font-mono text-text focus:outline-none focus:border-primary resize-y"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowPasteBox(false)}
              className="px-3 py-1.5 rounded-[8px] bg-white text-xs font-semibold text-muted hover:bg-gray-100"
            >
              Tutup
            </button>
            <button
              onClick={handleProcessPaste}
              className="px-4 py-1.5 rounded-[8px] bg-blue-600 text-white text-xs font-bold hover:brightness-105"
            >
              Proses Impor Teks
            </button>
          </div>
        </div>
      )}

      {/* MODE 1: TABULASI MASAL */}
      {viewMode === 'batch' && (
        <div className="bg-white border border-black rounded-none p-4 sm:p-6 shadow-sm text-black">
          <div className="border-b-2 border-black pb-3 mb-4 text-center">
            <h2 className="text-[17px] sm:text-[18px] font-extrabold uppercase tracking-wide text-black">
              TABULASI PEMETAAN PILIHAN SEKOLAH LANJUTAN ( {kelasFilter.toUpperCase()} )
            </h2>
            <p className="text-xs text-black/80 font-bold mt-0.5">
              {settings.namaSekolah || 'SIM BK PRO'}, TAHUN AJARAN {settings.tahunAjaran || '2026/2027'}
            </p>
          </div>

          <div className="overflow-x-auto border-t border-black">
            <table className="w-full text-[12px] border-collapse border border-black min-w-[880px]">
              <thead>
                <tr className="bg-gray-100 print:bg-transparent font-extrabold text-black">
                  <th className="border border-black px-2 py-2 text-center w-10">NO</th>
                  <th className="border border-black px-3 py-2 text-left w-48">NAMA SISWA</th>
                  <th className="border border-black px-2 py-2 text-center w-14">KELAS</th>
                  <th className="border border-black px-2 py-2 text-center w-16">RENCANA</th>
                  <th className="border border-black px-3 py-2 text-left">PILIHAN 1 (UTAMA)</th>
                  <th className="border border-black px-3 py-2 text-left w-36">JURUSAN 1</th>
                  <th className="border border-black px-3 py-2 text-left w-40">PILIHAN 2 (CADANGAN)</th>
                  <th className="border border-black px-3 py-2 text-left w-36">CITA-CITA</th>
                  <th className="border border-black px-2 py-2 text-center w-24">RESTU ORTU</th>
                  <th className="border border-black px-2 py-2 text-center w-14 print:hidden">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {displayedStudents.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="border border-black px-2 py-1 text-center font-bold">
                      {idx + 1}
                    </td>

                    <td className="border border-black px-2 py-0.5">
                      <input
                        type="text"
                        value={item.namaSiswa}
                        onChange={(e) => updateStudentField(item.id, 'namaSiswa', e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 font-bold text-black"
                      />
                    </td>

                    <td className="border border-black px-1 py-0.5 text-center">
                      <input
                        type="text"
                        value={item.kelas}
                        onChange={(e) => updateStudentField(item.id, 'kelas', e.target.value)}
                        className="w-12 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 font-bold text-black"
                      />
                    </td>

                    <td className="border border-black px-1 py-0.5 text-center">
                      <select
                        value={item.rencanaSetelahSMP}
                        onChange={(e) =>
                          updateStudentField(
                            item.id,
                            'rencanaSetelahSMP',
                            e.target.value as IndividualKarirAngket['rencanaSetelahSMP']
                          )
                        }
                        className="w-full text-xs font-bold py-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary text-center"
                      >
                        <option value="SMA">SMA</option>
                        <option value="SMK">SMK</option>
                        <option value="MA">MA</option>
                        <option value="Belum Memutuskan">Belum</option>
                      </select>
                    </td>

                    <td className="border border-black px-1.5 py-0.5">
                      <input
                        type="text"
                        value={item.pilihan1Sekolah}
                        onChange={(e) => updateStudentField(item.id, 'pilihan1Sekolah', e.target.value)}
                        placeholder="SMAN 1 / SMKN..."
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 font-bold text-black"
                      />
                    </td>

                    <td className="border border-black px-1.5 py-0.5">
                      <input
                        type="text"
                        value={item.pilihan1Jurusan}
                        onChange={(e) => updateStudentField(item.id, 'pilihan1Jurusan', e.target.value)}
                        placeholder="MIPA/Otomotif..."
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 text-gray-700"
                      />
                    </td>

                    <td className="border border-black px-1.5 py-0.5">
                      <input
                        type="text"
                        value={item.pilihan2Sekolah}
                        onChange={(e) => updateStudentField(item.id, 'pilihan2Sekolah', e.target.value)}
                        placeholder="Sekolah cadangan..."
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 text-xs text-gray-600"
                      />
                    </td>

                    <td className="border border-black px-1.5 py-0.5">
                      <input
                        type="text"
                        value={item.citaCita}
                        onChange={(e) => updateStudentField(item.id, 'citaCita', e.target.value)}
                        placeholder="Profesi..."
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 text-xs font-semibold text-black"
                      />
                    </td>

                    <td className="border border-black px-1 py-0.5 text-center">
                      <select
                        value={item.statusDiskusiOrtu}
                        onChange={(e) =>
                          updateStudentField(
                            item.id,
                            'statusDiskusiOrtu',
                            e.target.value as IndividualKarirAngket['statusDiskusiOrtu']
                          )
                        }
                        className={`w-full text-xs font-bold py-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary text-center ${
                          item.statusDiskusiOrtu === 'Setuju Penuh'
                            ? 'text-accent-800'
                            : item.statusDiskusiOrtu === 'Orang Tua Beda Pilihan'
                            ? 'text-red-700 font-extrabold underline'
                            : 'text-primary-2'
                        }`}
                      >
                        <option value="Setuju Penuh">Setuju</option>
                        <option value="Orang Tua Beda Pilihan">Beda Ortu</option>
                        <option value="Belum Dibicarakan Mendalam">Belum Pasti</option>
                      </select>
                    </td>

                    <td className="border border-black px-1 py-0.5 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(item.id, item.namaSiswa)}
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

          <div className="mt-5 pt-3 border-t border-black/30 text-[11px] text-muted flex justify-between items-center print:text-black">
            <p>Total: {displayedStudents.length} siswa terdata.</p>
            <p className="font-semibold">{settings.namaSekolah || 'SIM BK PRO'}</p>
          </div>
        </div>
      )}

      {/* MODE 2: LEMBAR ANGKET RESMI SISWA */}
      {viewMode === 'angket' &&
        (studentList.length === 0 ? (
          <div className="bk-card py-14 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-[14px] bg-primary-tint flex items-center justify-center text-primary">
              <Plus size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-[16px] font-black text-text">Belum ada data bimbingan karir</h3>
              <p className="text-xs text-muted max-w-[340px] mx-auto leading-relaxed">
                Tambahkan siswa satu per satu, atau tempel langsung kolom dari Excel / Google Sheets.
              </p>
            </div>
            <button
              onClick={handleAddBatchRow}
              className="bk-btn primary inline-flex"
            >
              <Plus size={16} />
              <span>Tambah Siswa Pertama</span>
            </button>
          </div>
        ) : (
          <KarirAngketForm
            current={current}
            updateCurrent={updateCurrent}
            settings={settings}
          />
        ))}

      {/* MODAL SIMULASI KERTAS HVS A4 / FOLIO PUTIH */}
      <HvsPreviewModal
        open={previewHvsOpen}
        onClose={() => setPreviewHvsOpen(false)}
        title={`Pratinjau Kertas HVS: Bimbingan Karir (${current.namaSiswa || 'Siswa'})`}
      >
        <KarirAngketForm
          current={current}
          updateCurrent={updateCurrent}
          settings={settings}
        />
      </HvsPreviewModal>
    </div>
  );
};

export default BimbinganKarirView;



