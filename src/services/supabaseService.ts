/**
 * Supabase Data Service untuk SIM-BK
 * Mengelola sinkronisasi data dua arah antara antarmuka React dan PostgreSQL Supabase
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type {
  Student,
  CounselingRecord,
  CaseItem,
  SchoolSettings,
  ProtaItem,
  JurnalRow,
  AKPDStatement,
  IndividualKarirAngket,
} from '../types';

// ============================================================================
// 1. STUDENTS SERVICE
// ============================================================================
export const studentService = {
  async getAll(): Promise<Student[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('nama', { ascending: true });
    if (error) {
      console.warn('Gagal memuat students dari Supabase:', error.message);
      return null;
    }
    return (data || []).map((row) => ({
      id: row.id,
      nama: row.nama,
      nis: row.nis,
      nisn: row.nisn || '-',
      jk: row.jk,
      kelas: row.kelas,
      status: row.status,
      namaWali: row.nama_wali || '',
      kontakWali: row.kontak_wali || '',
      alamat: row.alamat || '',
      catatanKhusus: row.catatan_khusus || '',
    }));
  },

  async insert(student: Student): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('students').insert({
      id: student.id,
      nama: student.nama,
      nis: student.nis,
      nisn: student.nisn || '-',
      jk: student.jk,
      kelas: student.kelas,
      status: student.status,
      nama_wali: student.namaWali || null,
      kontak_wali: student.kontakWali || null,
      alamat: student.alamat || null,
      catatan_khusus: student.catatanKhusus || null,
    });
    if (error) {
      console.error('Gagal insert student ke Supabase:', error.message);
      return false;
    }
    return true;
  },

  async update(id: string, updates: Partial<Student>): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.nama !== undefined) payload.nama = updates.nama;
    if (updates.nis !== undefined) payload.nis = updates.nis;
    if (updates.nisn !== undefined) payload.nisn = updates.nisn;
    if (updates.jk !== undefined) payload.jk = updates.jk;
    if (updates.kelas !== undefined) payload.kelas = updates.kelas;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.namaWali !== undefined) payload.nama_wali = updates.namaWali;
    if (updates.kontakWali !== undefined) payload.kontak_wali = updates.kontakWali;
    if (updates.alamat !== undefined) payload.alamat = updates.alamat;
    if (updates.catatanKhusus !== undefined) payload.catatan_khusus = updates.catatanKhusus;

    const { error } = await supabase.from('students').update(payload).eq('id', id);
    if (error) {
      console.error('Gagal update student di Supabase:', error.message);
      return false;
    }
    return true;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('students').delete().eq('id', id);
    return !error;
  },

  async saveAll(students: Student[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase || students.length === 0) return false;
    const rows = students.map((s) => ({
      id: s.id,
      nama: s.nama,
      nis: s.nis,
      nisn: s.nisn || '-',
      jk: s.jk,
      kelas: s.kelas,
      status: s.status,
      nama_wali: s.namaWali || null,
      kontak_wali: s.kontakWali || null,
      alamat: s.alamat || null,
      catatan_khusus: s.catatanKhusus || null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('students').upsert(rows);
    return !error;
  },
};

// ============================================================================
// 2. COUNSELING RECORDS SERVICE
// ============================================================================
export const counselingService = {
  async getAll(): Promise<CounselingRecord[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const { data, error } = await supabase
      .from('counseling_records')
      .select('*')
      .order('tanggal', { ascending: false });
    if (error) return null;
    return (data || []).map((row) => ({
      id: row.id,
      studentId: row.student_id || '',
      namaSiswa: row.nama_siswa,
      kelas: row.kelas,
      tanggal: row.tanggal,
      waktu: row.waktu,
      jenis: row.jenis,
      bidang: row.bidang,
      masalah: row.masalah,
      tindakLanjut: row.tindak_lanjut,
      status: row.status,
      tahap: row.tahap || undefined,
    }));
  },

  async insert(record: CounselingRecord): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const payload = {
      id: record.id,
      student_id: record.studentId || null,
      nama_siswa: record.namaSiswa,
      kelas: record.kelas,
      tanggal: record.tanggal,
      waktu: record.waktu,
      jenis: record.jenis,
      bidang: record.bidang,
      masalah: record.masalah,
      tindak_lanjut: record.tindakLanjut,
      status: record.status,
      tahap: record.tahap || null,
    };
    const { error } = await supabase.from('counseling_records').insert(payload);
    if (error && error.code === '23503') {
      // FK violation: retry without student_id
      const { error: retryError } = await supabase.from('counseling_records').insert({
        ...payload,
        student_id: null,
      });
      return !retryError;
    }
    return !error;
  },

  async update(id: string, updates: Partial<CounselingRecord>): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.namaSiswa !== undefined) payload.nama_siswa = updates.namaSiswa;
    if (updates.kelas !== undefined) payload.kelas = updates.kelas;
    if (updates.tanggal !== undefined) payload.tanggal = updates.tanggal;
    if (updates.waktu !== undefined) payload.waktu = updates.waktu;
    if (updates.jenis !== undefined) payload.jenis = updates.jenis;
    if (updates.bidang !== undefined) payload.bidang = updates.bidang;
    if (updates.masalah !== undefined) payload.masalah = updates.masalah;
    if (updates.tindakLanjut !== undefined) payload.tindak_lanjut = updates.tindakLanjut;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.tahap !== undefined) payload.tahap = updates.tahap;

    const { error } = await supabase.from('counseling_records').update(payload).eq('id', id);
    return !error;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('counseling_records').delete().eq('id', id);
    return !error;
  },

  async saveAll(records: CounselingRecord[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase || records.length === 0) return false;
    const rows = records.map((r) => ({
      id: r.id,
      student_id: r.studentId || null,
      nama_siswa: r.namaSiswa,
      kelas: r.kelas,
      tanggal: r.tanggal,
      waktu: r.waktu,
      jenis: r.jenis,
      bidang: r.bidang,
      masalah: r.masalah,
      tindak_lanjut: r.tindakLanjut,
      status: r.status,
      tahap: r.tahap || null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('counseling_records').upsert(rows);
    return !error;
  },
};

// ============================================================================
// 3. CASE ITEMS SERVICE
// ============================================================================
export const caseService = {
  async getAll(): Promise<CaseItem[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const { data, error } = await supabase
      .from('case_items')
      .select('*')
      .order('tanggal', { ascending: false });
    if (error) return null;
    return (data || []).map((row) => ({
      id: row.id,
      studentId: row.student_id || '',
      namaSiswa: row.nama_siswa,
      kelas: row.kelas,
      masalah: row.masalah,
      tanggal: row.tanggal,
      status: row.status,
    }));
  },

  async insert(item: CaseItem): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const payload = {
      id: item.id,
      student_id: item.studentId || null,
      nama_siswa: item.namaSiswa,
      kelas: item.kelas,
      masalah: item.masalah,
      tanggal: item.tanggal,
      status: item.status,
    };
    const { error } = await supabase.from('case_items').upsert(payload);
    if (error && error.code === '23503') {
      const { error: retryError } = await supabase.from('case_items').upsert({
        ...payload,
        student_id: null,
      });
      return !retryError;
    }
    return !error;
  },

  async updateStatus(id: string, status: 'Proses' | 'Selesai'): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('case_items').update({ status }).eq('id', id);
    return !error;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('case_items').delete().eq('id', id);
    return !error;
  },

  async saveAll(cases: CaseItem[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase || cases.length === 0) return false;
    const rows = cases.map((c) => ({
      id: c.id,
      student_id: c.studentId || null,
      nama_siswa: c.namaSiswa,
      kelas: c.kelas,
      masalah: c.masalah,
      tanggal: c.tanggal,
      status: c.status,
    }));
    const { error } = await supabase.from('case_items').upsert(rows);
    return !error;
  },
};

// ============================================================================
// 4. DAILY JOURNALS SERVICE
// ============================================================================
export const journalService = {
  async getAll(): Promise<JurnalRow[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const { data, error } = await supabase
      .from('daily_journals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return null;
    return (data || []).map((row) => ({
      id: row.id,
      hariTanggal: row.hari_tanggal,
      waktu: row.waktu,
      nama: row.nama,
      kelas: row.kelas,
      jenis: row.jenis,
      topik: row.topik,
      keterangan: row.keterangan,
    }));
  },

  async insert(row: JurnalRow): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('daily_journals').insert({
      id: row.id,
      hari_tanggal: row.hariTanggal,
      waktu: row.waktu,
      nama: row.nama,
      kelas: row.kelas,
      jenis: row.jenis,
      topik: row.topik,
      keterangan: row.keterangan,
    });
    return !error;
  },

  async update(id: string, updates: Partial<JurnalRow>): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const payload: Record<string, unknown> = {};
    if (updates.hariTanggal !== undefined) payload.hari_tanggal = updates.hariTanggal;
    if (updates.waktu !== undefined) payload.waktu = updates.waktu;
    if (updates.nama !== undefined) payload.nama = updates.nama;
    if (updates.kelas !== undefined) payload.kelas = updates.kelas;
    if (updates.jenis !== undefined) payload.jenis = updates.jenis;
    if (updates.topik !== undefined) payload.topik = updates.topik;
    if (updates.keterangan !== undefined) payload.keterangan = updates.keterangan;

    const { error } = await supabase.from('daily_journals').update(payload).eq('id', id);
    return !error;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('daily_journals').delete().eq('id', id);
    return !error;
  },

  async saveAll(rows: JurnalRow[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase || rows.length === 0) return false;
    const payload = rows.map((r) => ({
      id: r.id,
      hari_tanggal: r.hariTanggal,
      waktu: r.waktu,
      nama: r.nama,
      kelas: r.kelas,
      jenis: r.jenis,
      topik: r.topik,
      keterangan: r.keterangan,
    }));
    const { error } = await supabase.from('daily_journals').upsert(payload);
    return !error;
  },
};

// ============================================================================
// 5. SCHOOL SETTINGS SERVICE
// ============================================================================
export const settingsService = {
  // Kunci baris = id akun Supabase (owner), bukan 'default_school' global
  async get(): Promise<SchoolSettings | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      namaSekolah: data.nama_sekolah,
      npsn: data.npsn,
      alamat: data.alamat,
      instansiAtas: data.instansi_atas || '',
      teleponSekolah: data.telepon_sekolah || '',
      emailSekolah: data.email_sekolah || '',
      kotaSurat: data.kota_surat || '',
      kepalaSekolah: data.kepala_sekolah,
      nipKepala: data.nip_kepala,
      guruBK: data.guru_bk,
      nipGuruBK: data.nip_guru_bk,
      tahunAjaran: data.tahun_ajaran,
      logoUrl: data.logo_url || '',
      logoKananUrl: data.logo_kanan_url || '',
    };
  },

  async save(settings: SchoolSettings): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from('school_settings').upsert({
      id: user.id,
      nama_sekolah: settings.namaSekolah,
      npsn: settings.npsn,
      alamat: settings.alamat,
      instansi_atas: settings.instansiAtas || null,
      telepon_sekolah: settings.teleponSekolah || null,
      email_sekolah: settings.emailSekolah || null,
      kota_surat: settings.kotaSurat || null,
      kepala_sekolah: settings.kepalaSekolah,
      nip_kepala: settings.nipKepala,
      guru_bk: settings.guruBK,
      nip_guru_bk: settings.nipGuruBK,
      tahun_ajaran: settings.tahunAjaran,
      logo_url: settings.logoUrl || null,
      logo_kanan_url: settings.logoKananUrl || null,
      updated_at: new Date().toISOString(),
    });
    return !error;
  },
};

// ============================================================================
// 6. PROTA ITEMS SERVICE
// ============================================================================
export const protaService = {
  async getAll(): Promise<ProtaItem[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const { data, error } = await supabase
      .from('prota_items')
      .select('*')
      .order('urutan', { ascending: true });
    if (error) return null;
    return (data || []).map((row) => ({
      id: row.id,
      komponen: row.komponen,
      jenis: row.jenis,
      bidang: row.bidang,
      months: row.months || Array(12).fill(false),
      volume: row.volume || 1,
      sasaran: row.sasaran || 'Kelas 7, 8, 9',
    }));
  },

  async insert(item: ProtaItem, urutan = 1): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('prota_items').insert({
      id: item.id,
      komponen: item.komponen,
      jenis: item.jenis,
      bidang: item.bidang,
      months: item.months,
      volume: item.volume,
      sasaran: item.sasaran,
      urutan,
    });
    return !error;
  },

  async update(id: string, updates: Partial<ProtaItem>): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const payload: Record<string, unknown> = {};
    if (updates.komponen !== undefined) payload.komponen = updates.komponen;
    if (updates.jenis !== undefined) payload.jenis = updates.jenis;
    if (updates.bidang !== undefined) payload.bidang = updates.bidang;
    if (updates.months !== undefined) payload.months = updates.months;
    if (updates.volume !== undefined) payload.volume = updates.volume;
    if (updates.sasaran !== undefined) payload.sasaran = updates.sasaran;

    const { error } = await supabase.from('prota_items').update(payload).eq('id', id);
    return !error;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('prota_items').delete().eq('id', id);
    return !error;
  },

  async saveAll(items: ProtaItem[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase || items.length === 0) return false;
    const rows = items.map((p, idx) => ({
      id: p.id,
      komponen: p.komponen,
      jenis: p.jenis,
      bidang: p.bidang,
      months: p.months,
      volume: p.volume,
      sasaran: p.sasaran,
      urutan: idx + 1,
    }));
    const { error } = await supabase.from('prota_items').upsert(rows);
    return !error;
  },
};

// ============================================================================
// 7. CAREER SURVEYS (E-SHINRO) SERVICE
// ============================================================================
export const careerService = {
  async getAll(): Promise<IndividualKarirAngket[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const { data, error } = await supabase
      .from('career_surveys')
      .select('*')
      .order('nama_siswa', { ascending: true });
    if (error) return null;
    return (data || []).map((row) => ({
      id: row.id,
      namaSiswa: row.nama_siswa,
      kelas: row.kelas,
      noAbsen: row.no_absen || '1',
      nis: row.nis,
      nisn: row.nisn || '-',
      namaOrtu: row.nama_ortu || '',
      noHpOrtu: row.no_hp_ortu || '',
      rencanaSetelahSMP: row.rencana_setelah_smp || 'SMA',
      alasanRencana: row.alasan_rencana || '',
      pilihan1Sekolah: row.pilihan1_sekolah || '',
      pilihan1Jurusan: row.pilihan1_jurusan || '',
      pilihan1Jalur: row.pilihan1_jalur || 'Zonasi',
      pilihan1Alasan: row.pilihan1_alasan || '',
      pilihan2Sekolah: row.pilihan2_sekolah || '',
      pilihan2Jurusan: row.pilihan2_jurusan || '',
      pilihan2Jalur: row.pilihan2_jalur || 'Zonasi',
      rencanaCadangan3: row.rencana_cadangan3 || '',
      citaCita: row.cita_cita || '',
      alasanCitaCita: row.alasan_cita_cita || '',
      rencanaSetelahLanjutan: row.rencana_setelah_lanjutan || 'Kuliah (Perguruan Tinggi)',
      statusDiskusiOrtu: row.status_diskusi_ortu || 'Setuju Penuh',
      aspirasiPilihanOrtu: row.aspirasi_pilihan_ortu || '',
      kendalaKeluarga: row.kendala_keluarga || '',
      rataRapor: row.rata_rapor || '',
      rekomendasiBK: row.rekomendasi_bk || '',
      tindakLanjutBK: row.tindak_lanjut_bk || 'Rekomendasi Aman',
    }));
  },

  async upsert(item: IndividualKarirAngket): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const payload = {
      id: item.id,
      nama_siswa: item.namaSiswa,
      kelas: item.kelas,
      no_absen: item.noAbsen,
      nis: item.nis,
      nisn: item.nisn || '-',
      nama_ortu: item.namaOrtu || null,
      no_hp_ortu: item.noHpOrtu || null,
      rencana_setelah_smp: item.rencanaSetelahSMP,
      alasan_rencana: item.alasanRencana || null,
      pilihan1_sekolah: item.pilihan1Sekolah || null,
      pilihan1_jurusan: item.pilihan1Jurusan || null,
      pilihan1_jalur: item.pilihan1Jalur || 'Zonasi',
      pilihan1_alasan: item.pilihan1Alasan || null,
      pilihan2_sekolah: item.pilihan2Sekolah || null,
      pilihan2_jurusan: item.pilihan2Jurusan || null,
      pilihan2_jalur: item.pilihan2Jalur || 'Zonasi',
      rencana_cadangan3: item.rencanaCadangan3 || null,
      cita_cita: item.citaCita || null,
      alasan_cita_cita: item.alasanCitaCita || null,
      rencana_setelah_lanjutan: item.rencanaSetelahLanjutan,
      status_diskusi_ortu: item.statusDiskusiOrtu,
      aspirasi_pilihan_ortu: item.aspirasiPilihanOrtu || null,
      kendala_keluarga: item.kendalaKeluarga || null,
      rata_rapor: item.rataRapor || null,
      rekomendasi_bk: item.rekomendasiBK || null,
      tindak_lanjut_bk: item.tindakLanjutBK,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('career_surveys').upsert(payload);
    return !error;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('career_surveys').delete().eq('id', id);
    return !error;
  },

  async saveAll(items: IndividualKarirAngket[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase || items.length === 0) return false;
    const rows = items.map((k) => ({
      id: k.id,
      nama_siswa: k.namaSiswa,
      kelas: k.kelas,
      no_absen: k.noAbsen,
      nis: k.nis,
      nisn: k.nisn || '-',
      nama_ortu: k.namaOrtu || null,
      no_hp_ortu: k.noHpOrtu || null,
      rencana_setelah_smp: k.rencanaSetelahSMP,
      alasan_rencana: k.alasanRencana || null,
      pilihan1_sekolah: k.pilihan1Sekolah || null,
      pilihan1_jurusan: k.pilihan1Jurusan || null,
      pilihan1_jalur: k.pilihan1Jalur || 'Zonasi',
      pilihan1_alasan: k.pilihan1Alasan || null,
      pilihan2_sekolah: k.pilihan2Sekolah || null,
      pilihan2_jurusan: k.pilihan2Jurusan || null,
      pilihan2_jalur: k.pilihan2Jalur || 'Zonasi',
      rencana_cadangan3: k.rencanaCadangan3 || null,
      cita_cita: k.citaCita || null,
      alasan_cita_cita: k.alasanCitaCita || null,
      rencana_setelah_lanjutan: k.rencanaSetelahLanjutan,
      status_diskusi_ortu: k.statusDiskusiOrtu,
      aspirasi_pilihan_ortu: k.aspirasiPilihanOrtu || null,
      kendala_keluarga: k.kendalaKeluarga || null,
      rata_rapor: k.rataRapor || null,
      rekomendasi_bk: k.rekomendasiBK || null,
      tindak_lanjut_bk: k.tindakLanjutBK,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('career_surveys').upsert(rows);
    return !error;
  },
};

// ============================================================================
// 8. AKPD TALLIES SERVICE
// ============================================================================
export const akpdService = {
  async getAll(kelas = 'KELAS 8'): Promise<{ items: AKPDStatement[]; totalResponden: number; kelas: string } | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const { data, error } = await supabase
      .from('akpd_tallies')
      .select('*')
      .eq('kelas', kelas)
      .order('no', { ascending: true });
    if (error || !data || data.length === 0) return null;
    const items: AKPDStatement[] = data.map((r) => ({
      no: r.no,
      pernyataan: r.pernyataan,
      jumlahPemilih: r.jumlah_pemilih,
      jawaban: null,
    }));
    return {
      items,
      totalResponden: data[0].total_responden || 32,
      kelas: data[0].kelas || kelas,
    };
  },

  async saveTallies(items: AKPDStatement[], totalResponden: number, kelas = 'KELAS 8'): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase || items.length === 0) return false;
    const rows = items.map((it) => {
      const bidang =
        it.no <= 15 ? 'Pribadi' : it.no <= 30 ? 'Sosial' : it.no <= 45 ? 'Belajar' : 'Karir';
      const pct = totalResponden > 0 ? (it.jumlahPemilih / totalResponden) * 100 : 0;
      const prioritas = pct >= 60 ? 'Tinggi' : pct >= 40 ? 'Sedang' : 'Rendah';
      return {
        id: `akpd-${kelas.replace(/\s+/g, '_')}-${it.no}`,
        no: it.no,
        bidang,
        pernyataan: it.pernyataan,
        jumlah_pemilih: it.jumlahPemilih,
        total_responden: totalResponden,
        prioritas,
        topik_rpl: `Layanan ${bidang}: Butir ${it.no}`,
        kelas,
        updated_at: new Date().toISOString(),
      };
    });
    const { error } = await supabase.from('akpd_tallies').upsert(rows);
    return !error;
  },
};
