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

// Mapping 50 butir AKPD → Topik RPL untuk rekomendasi otomatis
export const AKPD_RPL_TOPICS: string[] = [
  'Membangun Spiritualitas & Syukur dalam Kehidupan Sehari-hari', // 1 Pribadi
  'Etika Pergaulan & Sopan Santun Remaja', // 2 Pribadi
  'Norma dan Etika Pergaulan Teman Sebaya', // 3 Pribadi
  'Mematuhi Tata Tertib & Disiplin Sekolah', // 4 Pribadi
  'Integritas Akademik & Mengatasi Perilaku Menyontek', // 5 Pribadi
  'Disiplin Kehadiran & Mengatasi Kebiasaan Membolos', // 6 Pribadi
  'Mengelola Emosi & Memaafkan dalam Relasi Interpersonal', // 7 Pribadi
  'Kepercayaan Diri & Mengatasi Kecemasan Sosial', // 8 Pribadi
  'Kesehatan Fisik & Kebersihan Diri Remaja', // 9 Pribadi
  'Eksplorasi Bakat & Minat Diri', // 10 Pribadi
  'Mengenali Gejala Kesehatan & Manajemen Kondisi Tubuh', // 11 Pribadi
  'Memahami Dinamika Keluarga & Komunikasi Keluarga Sehat', // 12 Pribadi
  'Resolusi Konflik Keluarga', // 13 Pribadi
  'Membangun Kemandirian & Tanggung Jawab Pribadi', // 14 Pribadi
  'Cerdas dan Bijak Menggunakan Gawai & Media Sosial', // 15 Pribadi
  'Mengatasi Ketergantungan Smartphone & Digital Detox', // 16 Sosial
  'Membangun Rasa Nyaman & Komunikasi di Rumah', // 17 Sosial
  'Mengatasi Perasaan Tidak Diperhatikan Orang Tua', // 18 Sosial
  'Komunikasi Efektif: Kata Maaf, Tolong, dan Terima Kasih', // 19 Sosial
  'Mengenal Kenakalan Remaja & Strategi Pencegahan', // 20 Sosial
  'Resolusi Konflik & Manajemen Perbedaan Pendapat', // 21 Sosial
  'Mengatasi Konflik dengan Teman Sebaya', // 22 Sosial
  'Membangun & Menjaga Persahabatan yang Sehat', // 23 Sosial
  'Stop Bullying: Menjadi Upstander di Sekolah', // 24 Sosial
  'Meningkatkan Keterampilan Sosial & Pergaulan Sehat', // 25 Sosial
  'Kesehatan Reproduksi Remaja & Edukasi Seksual', // 26 Sosial
  'Memahami Dampak Pacaran di Usia Remaja', // 27 Sosial
  'Komunikasi Terbuka Orang Tua-Anak tentang Seksualitas', // 28 Sosial
  'Pergaulan Sehat Lintas Gender', // 29 Sosial
  'Mengatasi Rasa Takut Bertanya & Berpartisipasi di Kelas', // 30 Sosial
  'Kepedulian Lingkungan & Aksi Nyata Pemanasan Global', // 31 Belajar
  'Bahaya Narkoba & Pencegahan Penyalahgunaan Zat', // 32 Belajar
  'Memilih Bimbingan Belajar yang Tepat', // 33 Belajar
  'Membangun Motivasi & Semangat Belajar', // 34 Belajar
  'Strategi Meraih Prestasi Akademik', // 35 Belajar
  'Mengenal Gaya Belajar & Strategi Belajar Efektif', // 36 Belajar
  'Teknik Memahami & Menguasai Materi Pelajaran', // 37 Belajar
  'Manfaat Belajar Kelompok & Kolaborasi', // 38 Belajar
  'Menemukan Metode Belajar yang Efektif untuk Diri Sendiri', // 39 Belajar
  'Mengatasi Kemalasan & Prokrastinasi Belajar', // 40 Belajar
  'Manajemen Waktu Belajar & Persiapan Ujian', // 41 Belajar
  'Keterlibatan Orang Tua dalam Pendampingan Belajar', // 42 Belajar
  'Mind Mapping & Teknik Belajar Visual', // 43 Belajar
  'Multiple Intelligence: Mengenal Kecerdasan Majemuk', // 44 Belajar
  'Cara Kerja Otak & Optimalisasi Fungsi Kognitif', // 45 Belajar
  'Literasi Keuangan Remaja: Mengelola Uang Saku', // 46 Karir
  'Membangun Kebiasaan Menabung Sejak Dini', // 47 Karir
  'Eksplorasi Bakat, Minat, dan Potensi Karir', // 48 Karir
  'Prospek Karir dari Setiap Mata Pelajaran', // 49 Karir
  'Eksplorasi Profesi & Orientasi Pilihan SMA/SMK', // 50 Karir
];

export const SAMPLE_AKPD_TALLY: number[] = [
  18, 14, 22, 19, 21, 8, 15, 17, 12, 24,
  9, 7, 11, 20, 29, 28, 6, 8, 16, 23,
  19, 13, 21, 25, 14, 16, 22, 18, 15, 23,
  10, 17, 15, 22, 20, 24, 26, 14, 25, 27,
  28, 9, 21, 18, 19, 23, 20, 21, 26, 27,
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
