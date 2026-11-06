export type NavView = 'beranda' | 'siswa' | 'akpd' | 'karir' | 'shinro' | 'dokumen' | 'pengaturan' | 'profil' | 'login' | '404';

export interface Student {
  id: string;
  nama: string;
  nis: string;
  nisn: string;
  jk: 'L' | 'P';
  kelas: string;
  status: 'Aktif' | 'Pindah' | 'Lulus';
  namaWali?: string;
  kontakWali?: string;
  alamat?: string;
  catatanKhusus?: string;
}

export interface CounselingRecord {
  id: string;
  studentId: string;
  namaSiswa: string;
  kelas: string;
  tanggal: string;
  waktu: string;
  jenis: 'Konseling Individual' | 'Konseling Kelompok' | 'Bimbingan Klasikal' | 'Kunjungan Rumah' | 'Konferensi Kasus';
  bidang: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir';
  masalah: string;
  tindakLanjut: string;
  status: 'Proses' | 'Selesai' | 'Menunggu';
  tahap?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  nama: string;
  jenis: 'Konseling' | 'Kunjungan' | 'Rapat' | 'Klasikal';
  status: 'Selesai' | 'Menunggu' | 'Terjadwal';
}

export interface CaseItem {
  id: string;
  studentId: string;
  namaSiswa: string;
  kelas: string;
  masalah: string;
  tanggal: string;
  status: 'Proses' | 'Selesai';
}

export interface DocumentMeta {
  id: string;
  title: string;
  desc: string;
  status: 'Draf' | 'Siap' | 'Final';
}

export interface ProtaItem {
  id: string;
  komponen: string;
  jenis: string;
  bidang: string;
  months: boolean[]; // 12 bulan: Jul - Jun
  volume: number;
  sasaran: string;
}

export interface SchoolSettings {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kepalaSekolah: string;
  nipKepala: string;
  guruBK: string;
  nipGuruBK: string;
  tahunAjaran: string;
  instansiAtas?: string;
  teleponSekolah?: string;
  emailSekolah?: string;
  kotaSurat?: string;
  logoUrl?: string;
  logoKananUrl?: string;
}

export interface AKPDItem {
  id: string;
  no: number;
  bidang: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir';
  pernyataan: string;
  jumlahPemilih: number;
  totalResponden: number;
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
  topikRPL: string;
}

export interface ShinroChosaItem {
  id: string;
  studentId: string;
  namaSiswa: string;
  kelas: string;
  pilihan1Sekolah: string;
  pilihan1Jurusan: string;
  pilihan2Sekolah: string;
  pilihan2Jurusan: string;
  citaCita: string;
  jalurMasuk: 'Zonasi' | 'Prestasi' | 'Afirmasi' | 'Tes Mandiri';
  statusOrtu: 'Setuju Penuh' | 'Beda Pendapat' | 'Menunggu Konseling';
  rekomendasiBK: string;
  tanggalUpdate: string;
}

export interface JurnalRow {
  id: string;
  hariTanggal: string;
  waktu: string;
  nama: string;
  kelas: string;
  jenis: string;
  topik: string;
  keterangan: string;
}

export interface AKPDStatement {
  no: number;
  pernyataan: string;
  jumlahPemilih: number;
  jawaban: 'ya' | 'tidak' | null;
}

export interface IndividualKarirAngket {
  id: string;
  namaSiswa: string;
  kelas: string;
  noAbsen: string;
  nis: string;
  nisn: string;
  namaOrtu: string;
  noHpOrtu: string;
  rencanaSetelahSMP: 'SMA' | 'SMK' | 'MA' | 'Belum Memutuskan';
  alasanRencana: string;
  pilihan1Sekolah: string;
  pilihan1Jurusan: string;
  pilihan1Jalur: 'Zonasi' | 'Prestasi Rapor/Lomba' | 'Afirmasi' | 'Tes Mandiri';
  pilihan1Alasan: string;
  pilihan2Sekolah: string;
  pilihan2Jurusan: string;
  pilihan2Jalur: 'Zonasi' | 'Prestasi' | 'Afirmasi' | 'Tes Mandiri';
  rencanaCadangan3: string;
  citaCita: string;
  alasanCitaCita: string;
  rencanaSetelahLanjutan: 'Kuliah (Perguruan Tinggi)' | 'Langsung Bekerja' | 'Wirausaha / Usaha Mandiri' | 'Kedinasan / TNI / POLRI';
  statusDiskusiOrtu: 'Setuju Penuh' | 'Orang Tua Beda Pilihan' | 'Belum Dibicarakan Mendalam';
  aspirasiPilihanOrtu: string;
  kendalaKeluarga: string;
  rataRapor: string;
  rekomendasiBK: string;
  tindakLanjutBK: 'Rekomendasi Aman' | 'Konseling Karir Lanjutan' | 'Pemanggilan Orang Tua';
}

export interface QuickCatatPayload {
  actionId: string;
  actionLabel: string;
  namaSiswa: string;
  kelas: string;
  tanggal: string;
  waktu: string;
  uraianMasalah: string;
  tindakLanjut: string;
  status: 'Proses' | 'Selesai' | 'Menunggu';
}
