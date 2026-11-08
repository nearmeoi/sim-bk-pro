import React, { useState } from 'react';
import { ArrowLeft, Printer, Save, Sparkles, BookOpen, Eye } from 'lucide-react';
import KopSurat from '../../ui/KopSurat';
import HvsPreviewModal from '../../ui/HvsPreviewModal';
import { useBK } from '../../../context/BKContext';
interface RplFormProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

interface TemplateRPL {
  topik: string;
  bidang: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir';
  tujuan: string;
  langkahInti: string;
}

const TEMPLATE_RPL_POPULER: TemplateRPL[] = [
  {
    topik: 'Cerdas dan Bijak Menggunakan Gawai & Media Sosial',
    bidang: 'Pribadi',
    tujuan: 'Peserta didik mampu memahami dampak positif dan negatif smartphone, mengenali tanda-tanda kecanduan digital, serta merancang jadwal harian bebas layar (screen-free time).',
    langkahInti: 'Guru BK menayangkan video singkat studi kasus dampak FOMO dan kecanduan game online. Siswa berdiskusi dalam kelompok 4 orang untuk menghitung screen time harian masing-masing dan membuat komitmen 3 aturan penggunaan gawai di rumah.',
  },
  {
    topik: 'Etika Pergaulan Teman Sebaya & Stop Bullying di Sekolah',
    bidang: 'Sosial',
    tujuan: 'Peserta didik mampu membedakan candaan wajar dan perundungan (bullying), menumbuhkan empati antar teman sebaya, serta berani menjadi pelindung (upstander) bila melihat bullying.',
    langkahInti: 'Konselor membagikan kartu situasi perilaku (verbal, fisik, sosial, dan siber). Siswa mengelompokkan kartu tersebut dan memeragakan respon penolakan tegas namun santun serta tata cara melapor ke Ruang BK.',
  },
  {
    topik: 'Strategi Manajemen Waktu & Mengatasi Prokrastinasi Belajar',
    bidang: 'Belajar',
    tujuan: 'Peserta didik mampu menyusun skala prioritas tugas sekolah menggunakan Matriks Eisenhower dan menerapkan teknik Pomodoro 25 menit untuk mengatasi kebiasaan menunda belajar.',
    langkahInti: 'Siswa memetakan daftar tugas mingguan ke dalam 4 kuadran penting/mendesak. Dilanjutkan dengan praktik simulasi teknik fokus 25 menit belajar tanpa distraksi dan membuat lembar jadwal mandiri.',
  },
  {
    topik: 'Eksplorasi Minat, Bakat, dan Orientasi Pilihan SMA/SMK',
    bidang: 'Karir',
    tujuan: 'Peserta didik memahami perbedaan mendasar kurikulum akademik SMA dan kurikulum vokasi kejuruan SMK, serta mampu menyelaraskan cita-cita masa depan dengan pilihan sekolah lanjutan.',
    langkahInti: 'Guru BK memaparkan profil rumpun jurusan SMA (MIPA/IPS) dan konsentrasi keahlian SMK (Teknik, DKV, Bisnis, Kesehatan). Siswa mengisi lembar eksplorasi karir dan saling bertukar aspirasi bersama teman sebaya.',
  },
];

export const RplForm: React.FC<RplFormProps> = ({ onBack, onToast }) => {
  const { settings, akpdRecommendations, setAkpdRecommendations } = useBK();
  const [previewHvsOpen, setPreviewHvsOpen] = useState(false);
  // Form State RPL 1 Lembar Kurikulum Merdeka
  const [komponenLayanan, setKomponenLayanan] = useState('Layanan Dasar');
  const [bidangBimbingan, setBidangBimbingan] = useState<'Pribadi' | 'Sosial' | 'Belajar' | 'Karir'>('Pribadi');
  const [topik, setTopik] = useState('Cerdas dan Bijak Menggunakan Gawai & Media Sosial');
  const [kelas, setKelas] = useState('Kelas 8');
  const [alokasiWaktu, _setAlokasiWaktu] = useState('1 Pertemuan x 40 Menit');
  const [fungsiLayanan, _setFungsiLayanan] = useState('Pemahaman dan Pencegahan');
  const [mediaAlat, _setMediaAlat] = useState('LCD Proyektor, Slide Presentasi, Lembar Kerja Peserta Didik (LKPD)');
  const [metode, _setMetode] = useState('Experiential Learning, Curah Pendapat (Brainstorming), & Diskusi Kelompok');

  const [tujuanLayanan, setTujuanLayanan] = useState(TEMPLATE_RPL_POPULER[0].tujuan);
  const [tahapAwal, _setTahapAwal] = useState(
    'Guru BK membuka sesi dengan salam hangat, presensi kehadiran, apersepsi keterkaitan materi dengan kehidupan sehari-hari, ice-breaking konsentrasi, serta menyampaikan tujuan layanan yang ingin dicapai.'
  );
  const [tahapInti, setTahapInti] = useState(TEMPLATE_RPL_POPULER[0].langkahInti);
  const [tahapPenutup, _setTahapPenutup] = useState(
    'Peserta didik diajak merumuskan kesimpulan bersama. Guru BK memberikan evaluasi refleksi pemahaman diri, motivasi penguatan karakter, serta doa penutup bersama.'
  );

  const [evaluasiProses, _setEvaluasiProses] = useState(
    'Mengamati antusiasme, keaktifan partisipasi, dinamika kelompok, serta keterbukaan siswa selama proses bimbingan klasikal berlangsung.'
  );
  const [evaluasiHasil, _setEvaluasiHasil] = useState(
    'Menilai lembar refleksi pemahaman materi (Understanding), kenyamanan perasaan (Comfort), dan rencana aksi konkret siswa pada lembar LKPD (Action).'
  );

  const handleApplyTemplate = (tmpl: TemplateRPL) => {
    setTopik(tmpl.topik);
    setBidangBimbingan(tmpl.bidang);
    setTujuanLayanan(tmpl.tujuan);
    setTahapInti(tmpl.langkahInti);
    onToast(`Topik "${tmpl.topik}" dipilih.`);
  };

  const handleApplyAkpd = (rec: { no: number; pernyataan: string; topikRPL: string; bidang: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir' }) => {
    setTopik(rec.topikRPL);
    setBidangBimbingan(rec.bidang);
    setTujuanLayanan(`Berdasarkan hasil AKPD, peserta didik memerlukan layanan bimbingan pada bidang ${rec.bidang} terkait: "${rec.pernyataan}" Peserta didik mampu memahami dan mengatasi kebutuhan tersebut.`);
    onToast(`Rekomendasi AKPD No.${rec.no}: "${rec.topikRPL}" dipilih.`);
  };

  const handleSave = () => {
    onToast('RPL berhasil disimpan.');
  };

  return (
    <div className="fade-up space-y-6 max-w-4xl mx-auto">
      <style>{`@media print { @page { size: A4 portrait; margin: 0 !important; } html, body { padding: 8mm 18mm 8mm 14mm !important; } }`}</style>
      {/* Header Bar */}
      <div className="print:hidden flex items-center justify-between">
        <button onClick={onBack} className="bk-chip !min-h-[44px] text-xs font-bold">
          <ArrowLeft size={16} /> Kembali ke Dokumen
        </button>
        <span className="text-xs bg-neutral-100 text-black font-bold px-3.5 py-1.5 rounded-full">
          Format Baku 1-Lembar Kurikulum Merdeka
        </span>
      </div>

      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-[750] text-text tracking-tight">
            RPL 1-Lembar (Bimbingan Klasikal)
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
            onClick={handleSave}
            className="min-h-[40px] px-4 rounded-[12px] bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save size={15} />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* Rekomendasi dari AKPD - Hidden on Print */}
      {akpdRecommendations.length > 0 && (
        <div className="print:hidden p-4 rounded-[16px] bg-neutral-50 border border-neutral-300 space-y-2.5">
          <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
            <Sparkles size={15} /> Rekomendasi Topik RPL dari Hasil AKPD:
          </span>
          <div className="flex flex-wrap gap-2">
            {akpdRecommendations.map((rec) => (
              <button
                key={`rec-${rec.no}`}
                type="button"
                onClick={() => handleApplyAkpd(rec)}
                className="px-3 py-1.5 rounded-[10px] bg-white border border-neutral-300 hover:border-black text-xs font-bold text-text hover:text-black transition-all shadow-xs text-left"
              >
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800 mr-1.5">
                  {rec.bidang} (#{rec.no})
                </span>
                {rec.topikRPL}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAkpdRecommendations([])}
              className="px-2 py-1.5 rounded-[10px] bg-white border border-neutral-300 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-all shadow-xs"
              title="Tutup rekomendasi dan gunakan template populer"
            >
              ✕ Tutup
            </button>
          </div>
        </div>
      )}

      {/* Template Cepat Populer - Hidden on Print */}
      <div className="print:hidden p-4 rounded-[16px] bg-neutral-100 border border-neutral-300 space-y-2.5">
        <span className="text-xs font-bold text-black flex items-center gap-1.5">
          <Sparkles size={15} /> Pilihan Contoh Topik Layanan:
        </span>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_RPL_POPULER.map((tmpl) => (
            <button
              key={tmpl.topik}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="px-3 py-1.5 rounded-[10px] bg-white border border-border/80 hover:border-black text-xs font-bold text-text hover:text-black transition-all shadow-xs text-left"
            >
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-black mr-1.5">
                {tmpl.bidang}
              </span>
              {tmpl.topik}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Form - Hidden on Print */}
      <div className="print:hidden bk-card space-y-4">
        <h3 className="text-sm font-bold text-text border-b border-border pb-2.5 flex items-center gap-2">
          <BookOpen size={16} className="text-black" /> Pengaturan Rincian RPL:
        </h3>

        <div className="grid sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-text mb-1">Komponen Layanan</label>
            <select
              value={komponenLayanan}
              onChange={(e) => setKomponenLayanan(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-[10px] border border-border text-xs font-semibold text-text bg-surface"
            >
              <option value="Layanan Dasar">Layanan Dasar</option>
              <option value="Layanan Responsif">Layanan Responsif</option>
              <option value="Peminatan & Perencanaan">Peminatan & Perencanaan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text mb-1">Bidang Bimbingan</label>
            <select
              value={bidangBimbingan}
              onChange={(e) => setBidangBimbingan(e.target.value as 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir')}
              className="w-full min-h-[44px] px-3 rounded-[10px] border border-border text-xs font-semibold text-text bg-surface"
            >
              <option value="Pribadi">Pribadi</option>
              <option value="Sosial">Sosial</option>
              <option value="Belajar">Belajar</option>
              <option value="Karir">Karir</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text mb-1">Sasaran Kelas</label>
            <input
              type="text"
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-[10px] border border-border text-xs text-text"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text mb-1">Topik / Tema Layanan *</label>
          <input
            type="text"
            value={topik}
            onChange={(e) => setTopik(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-[10px] border border-border text-xs font-bold text-text"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text mb-1">Tujuan Layanan</label>
          <textarea
            rows={2}
            value={tujuanLayanan}
            onChange={(e) => setTujuanLayanan(e.target.value)}
            className="w-full p-2.5 rounded-[10px] border border-border text-xs text-text resize-y leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text mb-1">Tahap Inti Kegiatan (30 Menit)</label>
          <textarea
            rows={3}
            value={tahapInti}
            onChange={(e) => setTahapInti(e.target.value)}
            className="w-full p-2.5 rounded-[10px] border border-border text-xs text-text resize-y leading-relaxed"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAMPILAN RESMI RPL 1-LEMBAR SIAP CETAK (STANDAR DINAS)   */}
      {/* ======================================================== */}
      <div className="bg-white border border-black rounded-none p-5 sm:p-8 shadow-sm print:border-none print:p-0 text-black text-[11px] leading-snug font-sans">
        {/* Kop Surat Sekolah Resmi */}
        <KopSurat settings={settings} compact />

        {/* Judul Dokumen RPL */}
        <div className="text-center mb-3 border-b border-black pb-1.5">
          <h2 className="text-[13px] font-black uppercase tracking-wide">
            RENCANA PELAKSANAAN LAYANAN (RPL) BIMBINGAN KLASIKAL
          </h2>
          <p className="text-[10px] font-bold text-gray-800">
            SEMESTER GANJIL / GENAP Â· TAHUN AJARAN {settings.tahunAjaran || '2026/2027'}
          </p>
        </div>

        {/* Tabel Identitas Layanan */}
        <table className="w-full border-collapse border border-black text-[10.5px] mb-2.5">
          <tbody>
            <tr>
              <td className="border border-black px-2.5 py-1.5 font-bold w-36 bg-gray-50 print:bg-transparent">
                Komponen Layanan
              </td>
              <td className="border border-black px-2.5 py-1.5">{komponenLayanan}</td>
              <td className="border border-black px-2.5 py-1.5 font-bold w-32 bg-gray-50 print:bg-transparent">
                Bidang Bimbingan
              </td>
              <td className="border border-black px-2.5 py-1.5 font-bold">{bidangBimbingan}</td>
            </tr>
            <tr>
              <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-50 print:bg-transparent">
                Topik / Tema Layanan
              </td>
              <td colSpan={3} className="border border-black px-2.5 py-1.5 font-extrabold text-[12px]">
                {topik}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-50 print:bg-transparent">
                Fungsi Layanan
              </td>
              <td className="border border-black px-2.5 py-1.5">{fungsiLayanan}</td>
              <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-50 print:bg-transparent">
                Sasaran / Kelas
              </td>
              <td className="border border-black px-2.5 py-1.5">{kelas}</td>
            </tr>
            <tr>
              <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-50 print:bg-transparent">
                Alokasi Waktu
              </td>
              <td className="border border-black px-2.5 py-1.5">{alokasiWaktu}</td>
              <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-50 print:bg-transparent">
                Metode Layanan
              </td>
              <td className="border border-black px-2.5 py-1.5">{metode}</td>
            </tr>
            <tr>
              <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-50 print:bg-transparent">
                Media & Alat
              </td>
              <td colSpan={3} className="border border-black px-2.5 py-1.5">{mediaAlat}</td>
            </tr>
          </tbody>
        </table>

        {/* Uraian 1 Lembar */}
        <div className="space-y-1.5 text-[10.5px] leading-snug">
          {/* 1. Tujuan */}
          <div className="border border-black p-2.5">
            <h3 className="font-bold uppercase text-[11px] mb-1 bg-gray-100 print:bg-transparent px-1 inline-block">
              1. Tujuan Layanan (Capaian Bimbingan Konseling)
            </h3>
            <p className="text-justify pl-1">{tujuanLayanan}</p>
          </div>

          {/* 2. Langkah Kegiatan */}
          <div className="border border-black p-2.5 space-y-1.5">
            <h3 className="font-bold uppercase text-[11px] bg-gray-100 print:bg-transparent px-1 inline-block">
              2. Langkah-Langkah Kegiatan Bimbingan Klasikal
            </h3>

            <div className="pl-1 space-y-1 text-justify">
              <p>
                <b>a. Tahap Awal / Pendahuluan (5 Menit) :</b> {tahapAwal}
              </p>
              <p>
                <b>b. Tahap Inti (30 Menit) :</b> {tahapInti}
              </p>
              <p>
                <b>c. Tahap Penutup (5 Menit) :</b> {tahapPenutup}
              </p>
            </div>
          </div>

          {/* 3. Evaluasi */}
          <div className="border border-black p-2.5 space-y-1">
            <h3 className="font-bold uppercase text-[11px] bg-gray-100 print:bg-transparent px-1 inline-block">
              3. Evaluasi Proses & Hasil Layanan
            </h3>
            <div className="pl-1 space-y-0.5 text-justify">
              <p>
                <b>a. Evaluasi Proses :</b> {evaluasiProses}
              </p>
              <p>
                <b>b. Evaluasi Hasil :</b> {evaluasiHasil}
              </p>
            </div>
          </div>
        </div>

        {/* Tanda Tangan Resmi Kepala Sekolah & Guru BK - Pas 1 Lembar */}
        <div className="mt-4 pt-1 grid grid-cols-2 text-center text-[10.5px] print:break-inside-avoid">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="mt-12">
              <p className="font-bold underline text-[11px]">
                {settings.kepalaSekolah || 'Belum Diisi di Pengaturan'}
              </p>
              <p className="text-[9.5px]">NIP. {settings.nipKepala || '19750101 200003 1 001'}</p>
            </div>
          </div>

          <div>
            <p>{settings.kotaSurat || 'diisi di Pengaturan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru Bimbingan dan Konseling</p>
            <div className="mt-12">
              <p className="font-bold underline text-[11px]">
                {settings.guruBK || 'Belum Diisi di Pengaturan'}
              </p>
              <p className="text-[9.5px]">NIP. {settings.nipGuruBK || '19880512 201402 2 003'}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-1.5 border-t border-black/30 text-[9.5px] text-gray-600 flex justify-between">
          <p>Bimbingan & Konseling Â· Kurikulum Merdeka</p>
          <p className="font-bold">Halaman 1 dari 1 (Format 1-Lembar Resmi)</p>
        </div>
      </div>

      {/* MODAL SIMULASI KERTAS HVS A4 / FOLIO PUTIH */}
      <HvsPreviewModal
        open={previewHvsOpen}
        onClose={() => setPreviewHvsOpen(false)}
        title="Pratinjau Kertas HVS: RPL 1-Lembar"
      >
        <KopSurat settings={settings} compact />
        <div className="text-center mb-4 border-b border-black pb-1.5">
          <h2 className="text-[13px] font-black uppercase tracking-wide">
            RENCANA PELAKSANAAN LAYANAN (RPL) BIMBINGAN KLASIKAL
          </h2>
          <p className="text-[10.5px] font-bold text-gray-800">
            SEMESTER GANJIL / GENAP Â· TAHUN AJARAN {settings.tahunAjaran || '2026/2027'}
          </p>
        </div>

        <table className="w-full border-collapse border border-black text-[10.5px] mb-3">
          <tbody>
            <tr>
              <td className="border border-black p-1.5 font-bold w-32 bg-gray-50">Komponen Layanan</td>
              <td className="border border-black p-1.5">{komponenLayanan}</td>
              <td className="border border-black p-1.5 font-bold w-28 bg-gray-50">Bidang</td>
              <td className="border border-black p-1.5 font-bold">{bidangBimbingan}</td>
            </tr>
            <tr>
              <td className="border border-black p-1.5 font-bold bg-gray-50">Topik / Tema</td>
              <td colSpan={3} className="border border-black p-1.5 font-black">{topik}</td>
            </tr>
            <tr>
              <td className="border border-black p-1.5 font-bold bg-gray-50">Sasaran / Waktu</td>
              <td className="border border-black p-1.5">{kelas} ({alokasiWaktu})</td>
              <td className="border border-black p-1.5 font-bold bg-gray-50">Metode</td>
              <td className="border border-black p-1.5">{metode}</td>
            </tr>
          </tbody>
        </table>

        <div className="space-y-2 text-[10.5px] leading-relaxed">
          <div className="border border-black p-2">
            <p className="font-bold uppercase text-[10px] mb-0.5 bg-gray-100 px-1 inline-block">1. Tujuan Layanan</p>
            <p>{tujuanLayanan}</p>
          </div>
          <div className="border border-black p-2 space-y-1">
            <p className="font-bold uppercase text-[10px] bg-gray-100 px-1 inline-block">2. Langkah Kegiatan</p>
            <p><b>a. Tahap Awal (5 Menit):</b> {tahapAwal}</p>
            <p><b>b. Tahap Inti (30 Menit):</b> {tahapInti}</p>
            <p><b>c. Tahap Penutup (5 Menit):</b> {tahapPenutup}</p>
          </div>
          <div className="border border-black p-2 space-y-0.5">
            <p className="font-bold uppercase text-[10px] bg-gray-100 px-1 inline-block">3. Evaluasi</p>
            <p><b>a. Proses:</b> {evaluasiProses}</p>
            <p><b>b. Hasil:</b> {evaluasiHasil}</p>
          </div>
        </div>

        <div className="mt-6 pt-2 grid grid-cols-2 text-center text-[10.5px]">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="mt-14">
              <p className="font-bold underline text-[11px]">{settings.kepalaSekolah || 'Kepala Sekolah'}</p>
              <p className="text-[9.5px]">NIP. {settings.nipKepala || '-'}</p>
            </div>
          </div>
          <div>
            <p>{settings.kotaSurat || 'diisi di Pengaturan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru BK / Konselor</p>
            <div className="mt-14">
              <p className="font-bold underline text-[11px]">{settings.guruBK || 'Guru BK'}</p>
              <p className="text-[9.5px]">NIP. {settings.nipGuruBK || '-'}</p>
            </div>
          </div>
        </div>
      </HvsPreviewModal>
    </div>
  );
};

export default RplForm;

