import { useState } from 'react';
import {
  Printer,
  Save,
  RotateCcw,
  Check,
  Download,
  Table,
  FileText,
  ClipboardPaste,
  ArrowRight,
  TrendingUp,
  Eye,
  Sparkles,
} from "lucide-react";
import PetunjukIbu from '../ui/PetunjukIbu';
import { confirmDialog } from '../ui/ConfirmModal';
import KopSurat from '../ui/KopSurat';
import HvsPreviewModal from '../ui/HvsPreviewModal';
import { useBK } from '../../context/BKContext';
import { exportToCsv } from '../../lib/exportCsv';
import type { AKPDStatement, NavView } from '../../types';

interface AKPDViewProps {
  onNav?: (v: NavView) => void;
  onToast: (msg: string) => void;
}



export default function AKPDView({ onNav, onToast }: AKPDViewProps) {
  const {
    akpdItems: items,
    updateAKPDItem,
    incrementAKPDTally,
    applyQuickAKPDNumbers,
    applyPasteAKPDTally,
    resetAKPD,
    totalRespondenAKPD: totalRespondenKelas,
    setTotalRespondenAKPD: setTotalRespondenKelas,
    kelasAKPD: kelas,
    setKelasAKPD: setKelas,
    settings,
    setAkpdRecommendations,
    setAkpdProtaTargets,
    setActiveDocTab,
  } = useBK();

  const [previewHvsOpen, setPreviewHvsOpen] = useState(false);
  const [namaSiswa, setNamaSiswa] = useState('');
  // Input cepat per lembar kertas siswa
  const [quickNumbers, setQuickNumbers] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteTallyText, setPasteTallyText] = useState('');
  const [viewMode, setViewMode] = useState<'cetak' | 'batch' | 'analisis'>('cetak');

  // Perhitungan Analisis 4 Bidang
  const pribadiItems = items.filter((it) => it.no >= 1 && it.no <= 15);
  const sosialItems = items.filter((it) => it.no >= 16 && it.no <= 30);
  const belajarItems = items.filter((it) => it.no >= 31 && it.no <= 45);
  const karirItems = items.filter((it) => it.no >= 46 && it.no <= 50);

  const calcBidangPct = (itemList: typeof items) => {
    if (itemList.length === 0 || totalRespondenKelas === 0) return 0;
    const totalVotes = itemList.reduce((sum, it) => sum + it.jumlahPemilih, 0);
    const maxPossible = itemList.length * totalRespondenKelas;
    return Math.round((totalVotes / maxPossible) * 100);
  };

  const pctPribadi = calcBidangPct(pribadiItems);
  const pctSosial = calcBidangPct(sosialItems);
  const pctBelajar = calcBidangPct(belajarItems);
  const pctKarir = calcBidangPct(karirItems);

  // Top 5 Kebutuhan Prioritas
  const sortedByTally = [...items].sort((a, b) => b.jumlahPemilih - a.jumlahPemilih);
  const top5Items = sortedByTally.slice(0, 5);

  const handleToggleAnswer = (index: number, answer: 'ya' | 'tidak') => {
    const current = items[index]?.jawaban;
    updateAKPDItem(index, { jawaban: current === answer ? null : answer });
  };

  const handleTextChange = (index: number, text: string) => {
    updateAKPDItem(index, { pernyataan: text });
  };

  const handleTallyCountChange = (index: number, val: number) => {
    updateAKPDItem(index, { jumlahPemilih: Math.max(0, val) });
  };

  const handleIncrementTally = (index: number) => {
    incrementAKPDTally(index, totalRespondenKelas);
  };

  const handleExportAKPD = () => {
    const headers = ['Nomor Butir', 'Pernyataan Kebutuhan', 'Jumlah Pemilih', 'Total Responden', 'Persentase (%)', 'Prioritas'];
    const rows = items.map((item) => {
      const pct = totalRespondenKelas > 0 ? ((item.jumlahPemilih / totalRespondenKelas) * 100).toFixed(1) : '0';
      const prioritas = Number(pct) >= 60 ? 'Tinggi' : Number(pct) >= 40 ? 'Sedang' : 'Rendah';
      return [item.no, item.pernyataan, item.jumlahPemilih, totalRespondenKelas, `${pct}%`, prioritas];
    });
    exportToCsv(`Rekap_AKPD_${kelas.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    onToast(`âœ“ Berhasil mengekspor 50 butir AKPD ${kelas} ke CSV!`);
  };
  const handleAddQuickNumbers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNumbers.trim()) return;

    const numbers = quickNumbers
      .split(/[\s,;]+/)
      .map((n) => parseInt(n))
      .filter((n) => !isNaN(n) && n >= 1 && n <= items.length);

    if (numbers.length === 0) {
      onToast('Nomor butir tidak valid. Masukkan angka antara 1 sampai 50.');
      return;
    }

    applyQuickAKPDNumbers(numbers);

    setQuickNumbers('');
    onToast(`${numbers.length} nomor butir berhasil dicentang.`);
  };

  const handleProcessPasteTally = () => {
    if (!pasteTallyText.trim()) return;
    const nums = pasteTallyText
      .split(/[\s,;\n\t]+/)
      .map((n) => parseInt(n))
      .filter((n) => !isNaN(n));

    if (nums.length === 0) {
      onToast('Tidak ada angka yang terbaca');
      return;
    }

    applyPasteAKPDTally(nums);

    setShowPasteBox(false);
    setPasteTallyText('');
    onToast(`${nums.length} nilai butir berhasil diperbarui.`);
  };

  const handleReset = async () => {
    const ok = await confirmDialog({
      title: 'Reset data AKPD ke format standar 50 butir?',
      confirmLabel: 'Ya, Reset',
      tone: 'danger',
    });
    if (ok) {
      resetAKPD();
      onToast('Data AKPD dikembalikan ke setelan awal.');
    }
  };

  const handlePrint = () => {
    setPreviewHvsOpen(true);
    setTimeout(() => window.print(), 150);
  };

  const handleSave = () => {
    onToast(`Data AKPD ${kelas} berhasil disimpan.`);
  };

  return (
    <div className="fade-up space-y-5 max-w-5xl mx-auto">
      {/* ======================================================== */}
      {/* BARIS 1: HEADER HALAMAN & PRIMARY ACTIONS (ROW BY ROW)    */}
      {/* ======================================================== */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-[750] text-text tracking-tight">
            Angket Kebutuhan Siswa (AKPD)
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
            onClick={handleExportAKPD}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Unduh hasil rekap AKPD ke file Excel"
          >
            <Download size={15} />
            <span>Unduh Excel</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[40px] px-4 rounded-[12px] bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save size={15} />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      <PetunjukIbu
        tips={[
          'Tab 1: Cetak lembar 50 butir untuk dibagikan ke siswa di kelas.',
          'Tab 2: Masukkan jumlah siswa yang mencentang tiap nomor setelah lembar terkumpul.',
          'Tab 3: Lihat otomatis persentase 4 bidang dan 5 masalah tertinggi di kelas.'
        ]}
      />
      {/* ======================================================== */}
      {/* BARIS 2: TAB NAVIGASI TAMPILAN (STANDAR INDUSTRI)        */}
      {/* ======================================================== */}
      <div className="print:hidden border-b border-border">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('cetak')}
            className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              viewMode === 'cetak'
                ? 'border-black text-black bg-neutral-100 rounded-t-[10px]'
                : 'border-transparent text-muted hover:text-text hover:bg-bg rounded-t-[10px]'
            }`}
          >
            <FileText size={16} />
            <span>1. Lembar Angket</span>
          </button>
          <button
            onClick={() => setViewMode('batch')}
            className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              viewMode === 'batch'
                ? 'border-black text-black bg-neutral-100 rounded-t-[10px]'
                : 'border-transparent text-muted hover:text-text hover:bg-bg rounded-t-[10px]'
            }`}
          >
            <Table size={16} />
            <span>2. Rekap Hitungan</span>
          </button>
          <button
            onClick={() => setViewMode('analisis')}
            className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              viewMode === 'analisis'
                ? 'border-black text-black bg-neutral-100 rounded-t-[10px]'
                : 'border-transparent text-muted hover:text-text hover:bg-bg rounded-t-[10px]'
            }`}
          >
            <TrendingUp size={16} />
            <span>3. Hasil Analisis</span>
          </button>
        </div>
      </div>
      {/* ======================================================== */}
      <div className="print:hidden bk-card p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Kontrol Kiri: Filter Kelas */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-text">
            <span>Pilih Tingkat:</span>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className="min-h-[38px] px-3.5 rounded-[10px] border border-border text-xs font-extrabold bg-surface text-gray-700"
            >
              <option value="KELAS 7">KELAS 7</option>
              <option value="KELAS 8">KELAS 8</option>
              <option value="KELAS 9">KELAS 9</option>
            </select>
          </label>

          {viewMode === 'batch' && (
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted pl-2 border-l border-border">
              <span>Siswa/Kelas:</span>
              <input
                type="number"
                min="1"
                value={totalRespondenKelas}
                onChange={(e) => setTotalRespondenKelas(parseInt(e.target.value) || 32)}
                className="w-14 min-h-[34px] text-center font-bold border border-border rounded-[8px] bg-white text-text text-xs"
              />
            </label>
          )}
        </div>

        {/* Kontrol Kanan: Tools & Utilities */}
        <div className="flex items-center gap-2">
          {viewMode === 'batch' && (
            <button
              onClick={() => setShowPasteBox(!showPasteBox)}
              className="min-h-[38px] px-3 rounded-[10px] bg-neutral-50 text-neutral-800 text-xs font-bold hover:bg-neutral-100 transition-all flex items-center gap-1.5 border border-neutral-300"
              title="Tempel deretan 50 angka sekaligus dari Excel"
            >
              <ClipboardPaste size={14} />
              <span>Tempel Angka dari Excel</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="min-h-[38px] px-3 rounded-[10px] bg-bg hover:bg-gray-200 text-muted hover:text-text text-xs font-bold transition-all flex items-center gap-1.5"
            title="Reset ke format standar awal"
          >
            <RotateCcw size={14} />
            <span>Setelan Awal</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* KOTAK INPUT CEPAT NOMOR LEMBAR SISWA (KHUSUS MODE BATCH) */}
      {/* ======================================================== */}
      {viewMode === 'batch' && (
        <div className="print:hidden bk-card bg-neutral-50 border border-neutral-300 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-neutral-800 flex items-center gap-1.5">
              <Check size={16} /> Input Cepat Nomor Centang:
            </span>
            <span className="text-[11px] text-muted">Tekan Enter untuk menyimpan satu lembar</span>
          </div>
          <form onSubmit={handleAddQuickNumbers} className="flex gap-2">
            <input
              type="text"
              value={quickNumbers}
              onChange={(e) => setQuickNumbers(e.target.value)}
              placeholder="Ketik nomor yang dicentang siswa, contoh: 1, 3, 5, 15, 16, 24, 40 (pisahkan koma/spasi)..."
              className="flex-1 min-h-[44px] px-4 rounded-[12px] border border-neutral-300 text-sm font-bold bg-white text-text focus:outline-none focus:border-black shadow-sm"
            />
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-[12px] bg-black text-white text-xs font-bold hover:bg-neutral-800 shrink-0 shadow-sm"
            >
              + Masukkan Lembar Siswa
            </button>
          </form>
        </div>
      )}

      {/* KOTAK TEMPEL ANGKA MASAL DARI EXCEL */}
      {showPasteBox && viewMode === 'batch' && (
        <div className="print:hidden bk-card bg-primary-tint border border-primary p-4 space-y-3 fade-up">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <ClipboardPaste size={16} /> Tempel 50 Angka Rekapitulasi (dari Excel / Catatan):
            </span>
            <button
              onClick={() => setShowPasteBox(false)}
              className="text-xs font-bold text-muted hover:text-text"
            >
              Tutup
            </button>
          </div>
          <p className="text-[12px] text-primary">
            Paste deretan angka total centang (dipisahkan spasi, koma, atau baris baru).
          </p>
          <textarea
            rows={3}
            value={pasteTallyText}
            onChange={(e) => setPasteTallyText(e.target.value)}
            placeholder="Contoh: 18, 14, 22, 19, 21, 8, 15, 17, 12, 24, 9, 7..."
            className="w-full p-3 rounded-[10px] border border-primary text-xs bg-white text-text font-mono focus:outline-none focus:border-primary"
          />
          <div className="flex justify-end">
            <button
              onClick={handleProcessPasteTally}
              className="min-h-[38px] px-4 rounded-[10px] bg-primary text-white font-bold text-xs hover:bg-neutral-800"
            >
              Terapkan ke 50 Butir
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BARIS 4: KONTEN UTAMA SESUAI MODE YANG DIPILIH           */}
      {/* ======================================================== */}

      {/* MODE 1: TABEL INPUT MASAL KILAT */}
      {viewMode === 'batch' && (
        <div className="bg-white border border-black rounded-none p-4 sm:p-6 shadow-sm text-black">
          <div className="text-center mb-5 border-b border-black pb-3">
            <h2 className="text-[16px] sm:text-[18px] font-extrabold uppercase tracking-wide text-black">
              TABEL TABULASI MASAL KEBUTUHAN PESERTA DIDIK
            </h2>
            <p className="text-xs font-semibold text-black/80 mt-0.5">
              {kelas} Â· TAHUN AJARAN 2026/2027 Â· TOTAL {totalRespondenKelas} SISWA PER KELAS
            </p>
          </div>

          <div className="overflow-x-auto border-t border-black">
            <table className="w-full text-[12.5px] border-collapse border border-black min-w-[760px]">
              <thead>
                <tr className="bg-gray-100 font-extrabold text-black">
                  <th className="border border-black px-2 py-2 text-center w-12">NO</th>
                  <th className="border border-black px-3 py-2 text-left min-w-[340px]">
                    P E R N Y A T A A N &nbsp; K E B U T U H A N
                  </th>
                  <th className="border border-black px-2 py-2 text-center w-36">
                    JUMLAH CENTANG (YA)
                  </th>
                  <th className="border border-black px-2 py-2 text-center w-24">
                    PERSENTASE
                  </th>
                  <th className="border border-black px-2 py-2 text-center w-24">
                    AKSI CEPAT
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const percent = Math.round((item.jumlahPemilih / totalRespondenKelas) * 100);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                      <td className="border border-black px-2 py-1.5 text-center font-bold">
                        {item.no}
                      </td>

                      <td className="border border-black px-3 py-1.5">
                        <input
                          type="text"
                          value={item.pernyataan}
                          onChange={(e) => handleTextChange(idx, e.target.value)}
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-black rounded px-1 py-0.5 text-black font-normal"
                        />
                      </td>

                      <td className="border border-black px-2 py-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={totalRespondenKelas}
                          value={item.jumlahPemilih}
                          onChange={(e) => handleTallyCountChange(idx, parseInt(e.target.value) || 0)}
                          className="w-16 min-h-[34px] text-center font-extrabold border border-gray-300 rounded bg-white text-black focus:outline-none focus:border-black shadow-sm"
                        />
                        <span className="text-xs text-muted ml-1">/ {totalRespondenKelas}</span>
                      </td>

                      <td className="border border-black px-2 py-1.5 text-center font-extrabold text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            percent >= 70
                              ? 'bg-alert-tint text-alert'
                              : percent >= 50
                                ? 'bg-neutral-200 text-neutral-800'
                                : 'bg-primary-tint text-primary'
                          }`}
                        >
                          {percent}%
                        </span>
                      </td>

                      <td className="border border-black px-1.5 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleIncrementTally(idx)}
                          className="px-3 py-1 rounded bg-black text-white font-bold text-xs hover:bg-neutral-800 active:scale-90 transition-all shadow-sm"
                          title="Klik +1 setiap melihat centang di kertas"
                        >
                          +1
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 pt-3 border-t border-black/30 text-xs text-muted flex justify-between items-center">
            <p>Rekap Tabulasi ({settings.namaSekolah || 'SIM BK PRO'})</p>
            <p className="font-semibold">{kelas} (50 Butir)</p>
          </div>
        </div>
      )}

      {/* MODE 2: LEMBAR ANGKET FORMAT KERTAS SIAP CETAK (1:1 SCREENSHOT) */}
      {viewMode === 'cetak' && (
        <div className="bg-white border border-black rounded-none p-5 sm:p-8 shadow-sm print:border-none print:p-0 text-black">
          {/* Kop Judul Angket Resmi */}
          <KopSurat
            settings={settings}
            judul={`ANGKET KEBUTUHAN PESERTA DIDIK (AKPD) Â· ${kelas}`}
            subjudul={`TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`}
          />

          {/* Identitas Siswa */}
          <div className="mb-4 text-[13px] sm:text-[14px] font-bold text-black flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <span>NAMA :</span>
              <input
                type="text"
                value={namaSiswa}
                onChange={(e) => setNamaSiswa(e.target.value)}
                placeholder="________________________________________"
                className="flex-1 font-normal bg-transparent border-b border-black/50 focus:border-black focus:outline-none px-1 text-[14px]"
              />
            </div>
            <div className="flex items-center gap-2 min-w-[180px]">
              <span>KELAS :</span>
              <input
                type="text"
                defaultValue="8A"
                placeholder="___________________"
                className="w-32 font-normal bg-transparent border-b border-black/50 focus:border-black focus:outline-none px-1 text-[14px]"
              />
            </div>
          </div>

          {/* Petunjuk Pengisian */}
          <div className="mb-4 text-[12px] sm:text-[13px] leading-relaxed text-black/90">
            <p className="font-bold underline mb-1">Petunjuk :</p>
            <ol className="list-decimal list-outside pl-4 space-y-0.5">
              <li>Dibawah ini bukan alat tes, tetapi angket kebutuhan untuk membuat program layanan bimbingan dan konseling.</li>
              <li>Jawaban Anda sangat bermanfaat untuk pembuatan program layanan BK di sekolah</li>
              <li>Pilihlah jawaban yang paling sesuai dengan kondisi Anda saat ini, dengan cara memberikan tanda (V) pada kolom Ya/Tidak</li>
              <li>Jawaban Anda akan kami rahasiakan, untuk itu jawablah dengan benar dan sungguh-sungguh.</li>
            </ol>
          </div>

          {/* TABEL ANGKET SIMPLE EDITABLE (Format 1:1 Screenshot) */}
          <div className="overflow-x-auto border-t border-black">
            <table className="w-full text-[12.5px] sm:text-[13px] border-collapse border border-black">
              <thead>
                <tr className="bg-gray-50 print:bg-transparent font-extrabold text-black">
                  <th className="border border-black px-2 py-2 text-center w-12 font-extrabold uppercase">
                    NO
                  </th>
                  <th className="border border-black px-3 py-2 text-center font-extrabold uppercase">
                    PERNYATAAN
                  </th>
                  <th className="border border-black px-2 py-2 text-center w-14 sm:w-16 font-extrabold uppercase">
                    YA
                  </th>
                  <th className="border border-black px-2 py-2 text-center w-14 sm:w-16 font-extrabold uppercase">
                    TIDAK
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50/40 print:hover:bg-transparent transition-colors group"
                  >
                    <td className="border border-black px-2 py-1 text-center font-bold align-middle">
                      {item.no}
                    </td>

                    <td className="border border-black px-2.5 py-1 align-middle">
                      <input
                        type="text"
                        value={item.pernyataan}
                        onChange={(e) => handleTextChange(idx, e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-black rounded px-1 py-0.5 text-black font-normal"
                        title="Klik untuk mengedit teks pernyataan"
                      />
                    </td>

                    <td
                      onClick={() => handleToggleAnswer(idx, 'ya')}
                      className="border border-black px-1 py-1 text-center cursor-pointer select-none hover:bg-neutral-50 print:hover:bg-transparent align-middle font-extrabold text-[15px]"
                    >
                      {item.jawaban === 'ya' ? (
                        <span className="text-black font-extrabold block">âœ“</span>
                      ) : (
                        <span className="text-transparent">.</span>
                      )}
                    </td>

                    <td
                      onClick={() => handleToggleAnswer(idx, 'tidak')}
                      className="border border-black px-1 py-1 text-center cursor-pointer select-none hover:bg-gray-100 print:hover:bg-transparent align-middle font-extrabold text-[15px]"
                    >
                      {item.jawaban === 'tidak' ? (
                        <span className="text-black font-extrabold block">âœ“</span>
                      ) : (
                        <span className="text-transparent">.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-4 text-xs text-muted print:text-black flex justify-between items-center">
            <p>Angket Kebutuhan Peserta Didik (50 Butir)</p>
            <p className="font-semibold">{kelas}, {settings.namaSekolah || 'SIM BK PRO'}</p>
          </div>
        </div>
      )}

      {/* MODE 3: TABEL & GRAFIK ANALISIS 4 BIDANG LAYANAN */}
      {viewMode === 'analisis' && (
        <div className="space-y-6 fade-up">
          {/* Header Kop Resmi Cetak */}
          <div className="hidden print:block">
            <KopSurat
              settings={settings}
              judul={`HASIL ANALISIS KEBUTUHAN PESERTA DIDIK (AKPD) Â· ${kelas}`}
              subjudul={`TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`}
            />
          </div>

          {/* Wadah Tabel Analisis Resmi (Model Angket Konsisten) */}
          <div className="bg-white border border-black rounded-none p-4 sm:p-6 shadow-sm text-black space-y-6">
            <div className="border-b-2 border-black pb-3 text-center">
              <h2 className="text-[16px] sm:text-[18px] font-extrabold uppercase tracking-wide text-black">
                REKAPITULASI & ANALISIS KEBUTUHAN PESERTA DIDIK (AKPD)
              </h2>
              <p className="text-xs text-black/80 font-bold mt-0.5">
                {kelas} Â· {settings.namaSekolah || 'SIM BK PRO'} Â· TAHUN AJARAN {settings.tahunAjaran || '2026/2027'} ({totalRespondenKelas} Siswa)
              </p>
            </div>

            {/* Bagian 1: Tabel Persentase 4 Bidang */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-black uppercase tracking-wide">
                  I. Persentase Kebutuhan per Bidang Layanan
                </h3>
                {onNav && (
                  <button
                    type="button"
                    onClick={() => {
                      // Generate Prota items from top 3 bidang with highest needs
                      const bidangData = [
                        { nama: 'Pribadi', pct: pctPribadi },
                        { nama: 'Sosial', pct: pctSosial },
                        { nama: 'Belajar', pct: pctBelajar },
                        { nama: 'Karir', pct: pctKarir },
                      ].sort((a, b) => b.pct - a.pct);

                      const topBidang = bidangData.slice(0, 3);
                      const protaTargets: any[] = topBidang.map((b, idx) => ({
                        id: `akpd-prota-${idx}`,
                        komponen: 'Layanan Dasar',
                        jenis: `Bimbingan Klasikal: Kebutuhan ${b.nama} (dari AKPD ${kelas})`,
                        bidang: b.nama as any,
                        months: Array(12).fill(true),
                        volume: 12,
                        sasaran: `Siswa ${kelas} dengan kebutuhan tinggi di bidang ${b.nama} (${b.pct}%)`,
                      }));

                      setAkpdProtaTargets(protaTargets);
                      setActiveDocTab('prota');
                      onNav('dokumen');
                    }}
                    className="min-h-[32px] px-3.5 rounded-[8px] bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <TrendingUp size={13} /> Buat Target Prota
                  </button>
                )}
              </div>
              <div className="overflow-x-auto border-t border-black">
                <table className="w-full text-[12px] sm:text-[13px] border-collapse border border-black min-w-[560px]">
                  <thead>
                    <tr className="bg-gray-100 font-extrabold text-black uppercase">
                      <th className="border border-black px-2 py-2 text-center w-10">NO</th>
                      <th className="border border-black px-3 py-2 text-left">BIDANG BIMBINGAN</th>
                      <th className="border border-black px-2 py-2 text-center w-28">JUMLAH BUTIR</th>
                      <th className="border border-black px-2 py-2 text-center w-36">RATA-RATA (%)</th>
                      <th className="border border-black px-2 py-2 text-center w-40">DERAJAT KEBUTUHAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { no: 1, nama: 'Bidang Pribadi', range: 'Butir 1 - 15', butir: 15, pct: pctPribadi },
                      { no: 2, nama: 'Bidang Sosial', range: 'Butir 16 - 30', butir: 15, pct: pctSosial },
                      { no: 3, nama: 'Bidang Belajar', range: 'Butir 31 - 45', butir: 15, pct: pctBelajar },
                      { no: 4, nama: 'Bidang Karir', range: 'Butir 46 - 50', butir: 5, pct: pctKarir },
                    ].map((row) => (
                      <tr key={row.no} className="hover:bg-gray-50/30 transition-colors">
                        <td className="border border-black px-2 py-2 text-center font-bold">{row.no}</td>
                        <td className="border border-black px-3 py-2 font-bold text-black">
                          <span>{row.nama}</span>
                          <span className="text-[11px] text-gray-500 font-normal ml-2">({row.range})</span>
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-medium">{row.butir} Butir</td>
                        <td className="border border-black px-2 py-2 text-center font-black text-sm">
                          {row.pct}%
                        </td>
                        <td className="border border-black px-2 py-2 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              row.pct >= 60
                                ? 'bg-alert-tint text-alert'
                                : row.pct >= 40
                                ? 'bg-neutral-200 text-neutral-800'
                                : 'bg-primary-tint text-primary'
                            }`}
                          >
                            {row.pct >= 60 ? 'Prioritas Tinggi' : row.pct >= 40 ? 'Prioritas Sedang' : 'Cukup Baik'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bagian 2: Tabel 5 Masalah Tertinggi */}
            <div className="space-y-2 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-black uppercase tracking-wide">
                  II. 5 Kebutuhan / Masalah Tertinggi di {kelas} (Rujukan Materi RPL)
                </h3>
                {onNav && (
                  <button
                    type="button"
                    onClick={() => {
                      const recs = top5Items.map(item => ({
                        no: item.no,
                        pernyataan: item.pernyataan,
                        topikRPL: item.topikRPL,
                        bidang: item.bidang,
                      }));
                      setAkpdRecommendations(recs);
                      setActiveDocTab('rpl');
                      onNav('dokumen');
                    }}
                    className="min-h-[32px] px-3.5 rounded-[8px] bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Sparkles size={13} /> Lihat Rekomendasi RPL
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border-t border-black">
                <table className="w-full text-[12px] sm:text-[13px] border-collapse border border-black min-w-[720px]">
                  <thead>
                    <tr className="bg-gray-100 font-extrabold text-black uppercase">
                      <th className="border border-black px-2 py-2 text-center w-14">PERINGKAT</th>
                      <th className="border border-black px-2 py-2 text-center w-20">NO BUTIR</th>
                      <th className="border border-black px-2 py-2 text-center w-24">BIDANG</th>
                      <th className="border border-black px-3 py-2 text-left">URAIAN PERNYATAAN MASALAH</th>
                      <th className="border border-black px-2 py-2 text-center w-28">JUMLAH PEMILIH</th>
                      <th className="border border-black px-2 py-2 text-center w-24">HASIL (%)</th>
                      <th className="border border-black px-2 py-2 text-center w-28">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5Items.map((item, idx) => {
                      const pct = totalRespondenKelas > 0 ? Math.round((item.jumlahPemilih / totalRespondenKelas) * 100) : 0;
                      const bidang = item.no <= 15 ? 'Pribadi' : item.no <= 30 ? 'Sosial' : item.no <= 45 ? 'Belajar' : 'Karir';
                      return (
                        <tr key={item.no} className="hover:bg-gray-50/30 transition-colors">
                          <td className="border border-black px-2 py-2 text-center font-black text-sm">
                            #{idx + 1}
                          </td>
                          <td className="border border-black px-2 py-2 text-center font-bold">
                            Butir {item.no}
                          </td>
                          <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">
                            {bidang}
                          </td>
                          <td className="border border-black px-3 py-2 text-black leading-snug font-medium">
                            {item.pernyataan}
                          </td>
                          <td className="border border-black px-2 py-2 text-center whitespace-nowrap text-xs">
                            {item.jumlahPemilih} dari {totalRespondenKelas} siswa
                          </td>
                          <td className="border border-black px-2 py-2 text-center font-black text-alert text-sm">
                            {pct}%
                          </td>
                          <td className="border border-black px-2 py-2 text-center">
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-alert-tint text-alert whitespace-nowrap">
                              Prioritas Tinggi
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Table Card */}
            <div className="pt-2 border-t border-black/30 text-[11px] text-muted flex justify-between items-center print:text-black">
              <p>Rekapitulasi Kebutuhan Peserta Didik (50 Butir)</p>
              <p className="font-semibold text-text">{settings.namaSekolah || 'SIM BK PRO'}</p>
            </div>
          </div>
          {/* Lembar Tanda Tangan Cetak */}
          <div className="hidden print:grid grid-cols-2 text-center text-xs pt-8">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">Kepala Sekolah</p>
              <div className="mt-16">
                <p className="font-bold underline">{settings.kepalaSekolah || 'Belum Diisi di Pengaturan'}</p>
                <p>NIP. {settings.nipKepala || '19750101 200003 1 001'}</p>
              </div>
            </div>
            <div>
              <p>{settings.kotaSurat || 'diisi di Pengaturan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <div className="mt-20">
                <p className="font-bold underline">{settings.guruBK || 'Belum Diisi di Pengaturan'}</p>
                <p>NIP. {settings.nipGuruBK || '19880512 201402 2 003'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIMULASI KERTAS HVS A4 / FOLIO PUTIH */}
      <HvsPreviewModal
        open={previewHvsOpen}
        onClose={() => setPreviewHvsOpen(false)}
        title={`Pratinjau Kertas HVS: Angket AKPD (${kelas})`}
      >
        <KopSurat
          settings={settings}
          judul={`ANGKET KEBUTUHAN PESERTA DIDIK (AKPD) Â· ${kelas}`}
          subjudul={`TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`}
        />

        <div className="mb-4 text-xs font-bold text-black flex justify-between border border-black p-2 bg-gray-50">
          <p>NAMA SISWA : ________________________________________</p>
          <p>KELAS : {kelas}</p>
        </div>

        <table className="w-full text-[11px] border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-gray-100 font-extrabold text-black">
              <th className="border border-black px-1.5 py-1 text-center w-8">NO</th>
              <th className="border border-black px-2 py-1 text-center font-extrabold">PERNYATAAN BUTIR KEBUTUHAN</th>
              <th className="border border-black px-1 py-1 text-center w-12">YA</th>
              <th className="border border-black px-1 py-1 text-center w-12">TIDAK</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.no}>
                <td className="border border-black px-1.5 py-1 text-center">{item.no}</td>
                <td className="border border-black px-2 py-1">{item.pernyataan}</td>
                <td className="border border-black px-1 py-1 text-center font-bold">
                  {item.jawaban === 'ya' ? 'âœ“' : ''}
                </td>
                <td className="border border-black px-1 py-1 text-center font-bold">
                  {item.jawaban === 'tidak' ? 'âœ“' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </HvsPreviewModal>
    </div>
  );
}

