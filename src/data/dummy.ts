/**
 * Data awal aplikasi — versi PRODUKSI (kosong, siap SaaS).
 * Salah konten: instrumen AKPD 50 butir & katalog dokumen tetap (itu konten
 * resmi aplikasi, bukan data simulasi). Semua data simulasi lain dihapus.
 */
import type {
  Student, CaseItem, DocumentMeta, SchoolSettings,
  CounselingRecord, ProtaItem, JurnalRow, IndividualKarirAngket
} from '../types';

// ---------------------------------------------------------------------------
// DATA MULA-MULA KOSONG — ibu guru mengisi sendiri
// ---------------------------------------------------------------------------
export const STUDENTS: Student[] = [];
export const INITIAL_COUNSELING_RECORDS: CounselingRecord[] = [];
export const CASES: CaseItem[] = [];
export const INITIAL_PROTA: ProtaItem[] = [];
export const INITIAL_JURNAL_ROWS: JurnalRow[] = [];
export const INITIAL_STUDENT_KARIR: IndividualKarirAngket[] = [];

export const SAMPLE_AKPD_TALLY: number[] = Array(50).fill(0);

// ---------------------------------------------------------------------------
// STENGAN SEKOLAH / KOPI SURAT — kosong, ibu isi di menu Pengaturan
// ---------------------------------------------------------------------------
export const DEFAULT_SETTINGS: SchoolSettings = {
  namaSekolah: '',
  npsn: '',
  alamat: '',
  kepalaSekolah: '',
  nipKepala: '',
  guruBK: '',
  nipGuruBK: '',
  tahunAjaran: '2026/2027',
  instansiAtas: '',
  teleponSekolah: '',
  emailSekolah: '',
  kotaSurat: '',
  logoUrl: '',
};

// ---------------------------------------------------------------------------
// KATALOG DOKUMEN (menu informasi, bukan data kelas)
// ---------------------------------------------------------------------------
export const DOCUMENTS: DocumentMeta[] = [
  { id: 'prota', title: 'Program Tahunan (Prota)', desc: 'Matriks rencana operasional layanan BK selama 1 tahun ajaran (12 bulan)', status: 'Siap' },
  { id: 'jurnal', title: 'Jurnal Harian BK', desc: 'Buku catatan harian layanan konselor untuk bukti fisik ekuivalensi 24 jam', status: 'Siap' },
  { id: 'rpl', title: 'RPL 1-Lembar (Kurikulum Merdeka)', desc: 'Modul bimbingan klasikal 1 lembar siap cetak', status: 'Siap' },
  { id: 'akpd', title: 'Angket Kebutuhan (AKPD 50 Butir)', desc: 'Instrumen asesmen kebutuhan peserta didik & analisis 4 bidang bimbingan', status: 'Siap' },
  { id: 'karir', title: 'Bimbingan Karir (Pilihan SMA/SMK)', desc: 'Pemetaan target sekolah lanjutan kelas 9 dan keselarasan restu orang tua', status: 'Siap' },
  { id: 'prosem', title: 'Program Semester (Prosem)', desc: 'Penjabaran agenda bimbingan per semester ganjil & genap', status: 'Draf' },
  { id: 'lapbul', title: 'Laporan Bulanan BK', desc: 'Rekapitulasi statistik layanan per bulan siap tanda tangan Kepsek', status: 'Draf' },
  { id: 'lapsem', title: 'Laporan Semester BK', desc: 'Evaluasi ketercapaian program BK semesteran untuk bukti dinas', status: 'Final' },
];

// ---------------------------------------------------------------------------
// INSTRUMEN RESMI: AKPD 50 BUTIR (isi disiplin Kemendikbud, TIDAK boleh diubah)
// ---------------------------------------------------------------------------
export const DEFAULT_AKPD_STATEMENTS: string[] = [
  'Saya kadang lupa bersyukur atas nikmat dan karunia dari Tuhan YME',
  'Saya kadang lupa untuk berprilaku sopan dan santun dalam kehidupan',
  'Saya merasa belum paham etika yang baik dan benar dalam pergaulan teman sebaya',
  'Saya merasa sulit mematuhi tata tertib di sekolah',
  'Kadang-kadang saya masih suka menyontek pada waktu ulangan',
  'Kadang-kadang saya masih suka membolos sekolah / les / jam pelajaran',
  'Rasa sakit hati / dendam masih membekas terhadap perlakuan orang lain',
  'Saya masih merasa cemas atau takut jika berada di depan umum atau keramaian',
  'Saya belum paham cara menjaga kesehatan tubuh dan kebersihan diri dengan baik',
  'Saya belum tahu cara melakukan eksplorasi bakat secara mandiri',
  'Saya masih sering mengalami sakit / alergi',
  'Kondisi keluarga saya sedang tidak harmonis',
  'Saya sedang mempunyai masalah dengan anggauta keluarga di rumah',
  'Saya merasa belum bisa menjadi pribadi yang mandiri',
  'Saya sering lupa waktu ketika bermain/membuka media sosial (fb, wa, instagram, dll)',
  'Saya merasa sulit mengendalikan ketergantungan dengan handphone',
  'Saya merasa tidak betah tinggal di rumah sendiri',
  'Saya merasa tidak pernah di perhatikan dari orang tua',
  'Kata maaf, tolong dan terimakasih kadang lupa saya ucapkan dalam pergaulan',
  'Saya belum tahu tentang bentuk-bentuk kenakalan remaja saat ini dan cara mensikapinya',
  'Saya sering beda pendapat dengan orang lain',
  'Saya sedang mempunyai masalah dengan teman di sekolah',
  'Saya belum tahu cara untuk menjaga persahabatan agar tetap langgeng',
  'Saya belum tahu tentang bullying dan cara mensikapinya',
  'Saya sukar bergaul dengan teman-teman di sekolah',
  'Saya merasa masih sedikit pemahaman tentang kesehatan reproduksi remaja',
  'Saya belum banyak tahu tentang dampak dari pacaran',
  'Saya malu jika membicarakan masalah seks dan pacar kepada orang tua',
  'Saya merasa malu jika bergaul dengan teman yang beda jenis kelamin',
  'Saya merasa takut bertanya atau menjawab di kelas',
  'Saya belum paham yang harus dilakukan dengan adanya pemanasan global',
  'Saya belum mengetahui banyak tentang jenis obat-obat terlarang serta dampaknya',
  'Saya belum tahu cara memilih lembaga bimbingan belajar',
  'Saya merasa tidak memiliki semangat belajar',
  'Saya belum tahu cara meraih prestasi di sekolah',
  'Saya belum paham tentang gaya belajar dan strategi yang sesuai dengannya',
  'Saya merasa kesulitan dalam memahami pelajaran',
  'Saya belum terbiasa belajar bersama atau kelompok',
  'Saya merasa belum menemukan cara belajar yang efektif',
  'Saya selalu malas untuk belajar di rumah',
  'Saya belajarnya jika akan ada ulangan atau ujian saja',
  'Orang tua kurang peduli dengan kegiatan belajar saya',
  'Saya belum bisa membuat peta pikiran (mind mapping)',
  'Saya belum mengenal tentang macam-macam kecerdasan',
  'Saya belum paham cara kerja otak kiri dan otak kanan',
  'Saya sering dimarahi orang tua karena boros',
  'Saya tidak terbiasa menabung',
  'Saya kurang dapat menyalurkan bakat dan minat di sekolah',
  'Saya belum tahu tentang prospek karir untuk setiap mapel',
  'Saya belum banyak tahu tentang jenis-jenis profesi di masyarakat dan Prospeknya',
];

export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length === 1
    ? parts[0].substring(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}
