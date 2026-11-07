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
  AKPDItem,
  IndividualKarirAngket,
} from '../types';

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
      nisn: row.nisn,
      jk: row.jk,
      kelas: row.kelas,
      status: row.status,
      namaWali: row.nama_wali,
      kontakWali: row.kontak_wali,
      alamat: row.alamat,
      catatanKhusus: row.catatan_khusus,
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
    const payload: any = { updated_at: new Date().toISOString() };
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
};

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
      studentId: row.student_id,
      namaSiswa: row.nama_siswa,
      kelas: row.kelas,
      tanggal: row.tanggal,
      waktu: row.waktu,
      jenis: row.jenis,
      bidang: row.bidang,
      masalah: row.masalah,
      tindakLanjut: row.tindak_lanjut,
      status: row.status,
      tahap: row.tahap,
    }));
  },

  async insert(record: CounselingRecord): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('counseling_records').insert({
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
    });
    return !error;
  },
};

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
};

export const settingsService = {
  async get(): Promise<SchoolSettings | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .eq('id', 'default_school')
      .maybeSingle();
    if (error || !data) return null;
    return {
      namaSekolah: data.nama_sekolah,
      npsn: data.npsn,
      alamat: data.alamat,
      instansiAtas: data.instansi_atas,
      teleponSekolah: data.telepon_sekolah,
      emailSekolah: data.email_sekolah,
      kotaSurat: data.kota_surat,
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
    const { error } = await supabase.from('school_settings').upsert({
      id: 'default_school',
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
